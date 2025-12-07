import os
import csv
from io import StringIO
from flask import Flask, request, jsonify, Response, send_file
from flask_cors import CORS
from dotenv import load_dotenv
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

# New: SendGrid + Mercado Pago
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import mercadopago

# ================== APP + ENV + DB SETUP ==================

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Use DATABASE_URL from environment or fall back to local file for dev
db_url = os.environ.get("DATABASE_URL", "sqlite:///rsvp_dev.db")
app.config["SQLALCHEMY_DATABASE_URI"] = db_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

# ========== CONFIGURAÇÕES GERAIS ==========

# SendGrid (para envio de e-mails)
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY", "")
EMAIL_SENDER = os.getenv("EMAIL_SENDER", "nicolebruno@casar.net.br")

# URL do site (usado nos e-mails de RSVP e nos back_urls do MP)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
SITE_URL = FRONTEND_URL  # mantém o nome antigo usado no código

# Mercado Pago
MP_ACCESS_TOKEN = os.getenv("MP_ACCESS_TOKEN", "")
sdk = mercadopago.SDK(MP_ACCESS_TOKEN) if MP_ACCESS_TOKEN else None

# Admin token para exportar RSVPs
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "Admin7849")

# Lista de e-mails dos noivos
GROOMS_EMAILS = [
    "nicoleochove@gmail.com",
    "brrunarib@gmail.com"
]

# Cabeçalho padrão para exportar CSV
CSV_HEADERS = ["Nome", "Email", "Acompanhantes", "Criancas", "Mensagem", "Vai Vir"]


# ================== MODEL ==================

class Rsvp(db.Model):
    __tablename__ = "rsvps"

    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), nullable=False, unique=True)
    acompanhantes = db.Column(db.Integer, default=0)
    criancas = db.Column(db.Integer, default=0)
    mensagem = db.Column(db.Text, nullable=True)
    vai_vir = db.Column(db.Boolean, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    def to_dict(self):
        return {
            "id": self.id,
            "nome": self.nome,
            "email": self.email,
            "acompanhantes": self.acompanhantes,
            "criancas": self.criancas,
            "mensagem": self.mensagem,
            "vai_vir": self.vai_vir,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


# Cria a tabela uma vez (tanto local quanto no Fly)
with app.app_context():
    db.create_all()


# ================== HELPERS ==================

def enviar_email(destinatarios, assunto, corpo):
    """Envia e-mail usando SendGrid. Se a API key não estiver configurada,
    apenas loga no console (útil em desenvolvimento)."""

    if isinstance(destinatarios, str):
        destinatarios = [destinatarios]

    if not SENDGRID_API_KEY:
        print("SENDGRID_API_KEY não configurada. E-mail NÃO enviado.")
        print(f"[DEBUG] Would send to {destinatarios}: {assunto}\n{corpo}\n")
        return

    message = Mail(
        from_email=EMAIL_SENDER,
        to_emails=destinatarios,
        subject=assunto,
        plain_text_content=corpo,
    )

    try:
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        print(f"E-mail enviado. Status: {response.status_code}")
    except Exception as e:
        print(f"Erro ao enviar e-mail via SendGrid: {e}")


def compute_confirmed_list_and_total():
    """
    Lê TODOS os RSVPs do banco e monta:
    - lista_confirmados: ["💌 Nome, com X acompanhantes...", ...]
    - total_pessoas: soma de adultos + crianças
    (regra igual ao código antigo baseado em CSV)
    """
    confirmados = Rsvp.query.filter_by(vai_vir=True).all()

    lista_confirmados = []
    total_pessoas = 0

    for r in confirmados:
        nome_c = r.nome

        adultos_raw = r.acompanhantes or 0
        cri = r.criancas or 0

        # Always count at least the guest (1 adult)
        adultos_total = adultos_raw if adultos_raw > 0 else 1
        adicionais = max(adultos_total - 1, 0)

        partes = []
        if adicionais > 0:
            partes.append(f"{adicionais} acompanhante(s) adulto")
        if cri > 0:
            partes.append(f"{cri} acompanhante(s) infantil")

        if partes:
            descricao = f"💌 {nome_c}, com " + " e ".join(partes)
        else:
            descricao = f"💌 {nome_c}"

        lista_confirmados.append(descricao)
        total_pessoas += adultos_total + cri

    return lista_confirmados, total_pessoas


# ================== ENDPOINT: GET /api/rsvp (buscar existente por e-mail) ==================

@app.route("/api/rsvp", methods=["GET"])
def get_rsvp():
    """
    Busca um RSVP existente pelo e-mail.
    - 400 se não enviar e-mail.
    - 404 se não encontrar RSVP.
    - 200 + dados completos se encontrar.
    """
    email = request.args.get("email", "").strip().lower()
    if not email:
        return jsonify({"erro": "E-mail não fornecido"}), 400

    existing = Rsvp.query.filter_by(email=email).first()
    if not existing:
        return jsonify({"erro": "Nenhum RSVP encontrado para este e-mail."}), 404

    return jsonify({
        "id": existing.id,
        "nome": existing.nome,
        "email": existing.email,
        "acompanhantes": existing.acompanhantes or 0,
        "criancas": existing.criancas or 0,
        "mensagem": existing.mensagem or "",
        "vai_vir": bool(existing.vai_vir),
        "created_at": existing.created_at.isoformat() if existing.created_at else None,
        "updated_at": existing.updated_at.isoformat() if existing.updated_at else None,
    }), 200


# ================== ENDPOINT: POST/PUT /api/rsvp (criar / atualizar) ==================

@app.route("/api/rsvp", methods=["POST", "PUT"])
def handle_rsvp():
    """
    - POST: cria um novo RSVP (email único).
    - PUT: atualiza RSVP existente, usando apenas o e-mail como chave.
      Nome e e-mail NÃO são alterados em updates.
    """

    data = request.get_json() or {}

    nome = (data.get("nome") or "").strip()
    email = (data.get("email") or "").strip().lower()
    acompanhantes = int(data.get("acompanhantes") or 0)
    criancas = int(data.get("criancas") or 0)
    mensagem = (data.get("mensagem") or "").strip()
    vai_vir = bool(data.get("vai_vir"))

    if not email:
        return jsonify({"erro": "E-mail é obrigatório."}), 400

    existing = Rsvp.query.filter_by(email=email).first()

    # ---------- POST = new RSVP ----------
    if request.method == "POST":
        if not nome:
            return jsonify({"erro": "Nome é obrigatório."}), 400

        if existing:
            # email already used -> frontend shows 'Esse e-mail já foi usado...'
            return jsonify({"erro": "RSVP já existente para este e-mail."}), 409

        r = Rsvp(
            nome=nome,
            email=email,
            acompanhantes=acompanhantes,
            criancas=criancas,
            mensagem=mensagem,
            vai_vir=vai_vir,
        )
        db.session.add(r)
        db.session.commit()

        # Monta lista + total de pessoas (a partir do banco)
        lista_confirmados, total_pessoas = compute_confirmed_list_and_total()

        # Safety: se o usuário preenche 0 adultos, conta pelo menos 1 (ele mesmo)
        acompanhantes_display = acompanhantes if acompanhantes > 0 else 1

        # E-mail para os noivos (mantém mesma lógica do código antigo)
        if vai_vir:
            assunto = "Nova Confirmação de Presença ✨"
            corpo = (
                f"🎉 YEYYY! {nome} confirmou presença com "
                f"{acompanhantes_display} adulto(s) e {criancas} criança(s)!"
            )
        else:
            assunto = "Confirmação negativa recebida ❌"
            corpo = f"Que pena, {nome} não poderá comparecer."

        corpo += (
            "\n\n📋 Lista atualizada de confirmados:\n"
            + "\n".join(lista_confirmados)
            + f"\n\n👥 Total de pessoas esperadas: {total_pessoas}"
        )

        enviar_email(GROOMS_EMAILS, assunto, corpo)

        # E-mail para o convidado
        corpo_convidado = (
            f"Olá {nome},\n\n"
            f"{'Estamos muito felizes com sua resposta!' if vai_vir else 'Obrigada por nos informar...'}\n\n"
            f"{'Obrigado por confirmar sua presença' if vai_vir else 'Sentiremos sua falta'} no nosso casamento! 💍\n\n"
            "Com carinho,\nNicole & Bruno ✨"
        )

        enviar_email(
            email,
            "Obrigado por confirmar sua presença!" if vai_vir else "Sentiremos sua falta!",
            corpo_convidado
        )

        return jsonify({"status": "ok", "rsvp": r.to_dict()}), 201

    # ---------- PUT = update existing RSVP ----------
    if not existing:
        # Em teoria o frontend só entra no modo update depois de receber 409 do POST,
        # então aqui quase nunca acontece. Mas retornamos 404 pra ser claro.
        return jsonify({"erro": "Nenhum RSVP encontrado para este e-mail."}), 404

    # NÃO tocamos em existing.nome nem existing.email
    existing.acompanhantes = acompanhantes
    existing.criancas = criancas
    existing.mensagem = mensagem
    existing.vai_vir = vai_vir

    db.session.commit()

    # Recalcula lista + total de pessoas
    lista_confirmados, total_pessoas = compute_confirmed_list_and_total()

    # Safety para texto do e-mail
    acompanhantes_display = acompanhantes if acompanhantes > 0 else 1

    # E-mail para os noivos, versão "alteração"
    if vai_vir:
        assunto = "Alteração na confirmação 💡"
        corpo = (
            f"🔄 {existing.nome} alterou sua confirmação e agora VAI comparecer "
            f"com {acompanhantes_display} adulto(s) e {criancas} criança(s)."
        )
    else:
        assunto = "Alteração de RSVP ❌"
        corpo = (
            f"🔄 {existing.nome} alterou sua confirmação e agora NÃO poderá comparecer."
        )

    corpo += (
        "\n\n📋 Lista atualizada de confirmados:\n"
        + "\n".join(lista_confirmados)
        + f"\n\n👥 Total de pessoas esperadas: {total_pessoas}"
    )

    enviar_email(GROOMS_EMAILS, assunto, corpo)

    # E-mail para o convidado
    corpo_convidado = (
        f"Olá {existing.nome},\n\n"
        "Sua confirmação foi atualizada com sucesso.\n\n"
        f"{'Estamos muito felizes que você poderá estar conosco! 💍' if vai_vir else 'Que pena que você não poderá comparecer, mas agradecemos por nos avisar.'}\n\n"
        "Com carinho,\nNicole & Bruno ✨"
    )

    enviar_email(
        existing.email,
        "Sua confirmação foi atualizada",
        corpo_convidado
    )

    return jsonify({"status": "ok", "rsvp": existing.to_dict()}), 200


# ================== EXPORTAR RSVPs (APENAS ADMIN) – VIA BANCO ==================

@app.route("/api/admin/rsvp-export", methods=["GET"])
def rsvp_export():
    """
    Exporta a lista de RSVPs diretamente do BANCO DE DADOS em formato CSV.

    Protegido por token simples: ?token=Admin7849
    (na produção usamos o valor de ADMIN_TOKEN).
    """
    token = request.args.get("token", "")

    if token != ADMIN_TOKEN:
        return jsonify({"erro": "Não autorizado"}), 401

    rsvps = Rsvp.query.order_by(Rsvp.created_at.asc()).all()
    if not rsvps:
        return jsonify({"erro": "Ainda não há RSVPs salvos."}), 404

    output = StringIO()
    writer = csv.writer(output)

    writer.writerow(CSV_HEADERS)
    for r in rsvps:
        writer.writerow([
            r.nome,
            r.email,
            r.acompanhantes or 0,
            r.criancas or 0,
            (r.mensagem or "").replace("\n", " ").replace("\r", " "),
            "Sim" if r.vai_vir else "Não",
        ])

    csv_data = output.getvalue()
    # Excel-friendly: add BOM so "Não" doesn't become "NÃ£o"
    csv_with_bom = "\ufeff" + csv_data

    return Response(
        csv_with_bom,
        mimetype="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": "attachment; filename=rsvp_export.csv"
        },
    )


# ================== MERCADO PAGO CHECKOUT PRO (REDIRECT) ==================

@app.route("/api/mercadopago/checkout", methods=["POST"])
def criar_preferencia_checkout():
    """Cria uma preferência de pagamento do Mercado Pago e retorna o init_point
    para redirecionar o convidado para o checkout (cartão / Pix / boleto)."""

    if not sdk:
        return jsonify({"erro": "Mercado Pago não configurado no servidor (MP_ACCESS_TOKEN ausente)."}), 500

    data = request.json or {}

    items = data.get("items", [])
    nome = data.get("nome", "Convidado")
    email = data.get("email", "")
    mensagem = data.get("mensagem", "")

    if not items:
        return jsonify({"erro": "Nenhum item recebido para pagamento."}), 400

    # Monta a lista de itens no formato que o MP espera
    mp_items = []
    for item in items:
        try:
            title = item.get("title", "Presente de casamento")
            unit_price = float(item.get("unit_price", 0))
            quantity = int(item.get("quantity", 1))
        except (TypeError, ValueError):
            return jsonify({"erro": "Dados inválidos em um dos itens."}), 400

        if unit_price <= 0 or quantity <= 0:
            return jsonify({"erro": "Preço ou quantidade inválidos em um dos itens."}), 400

        mp_items.append(
            {
                "title": title,
                "unit_price": unit_price,
                "quantity": quantity,
                "currency_id": "BRL",
            }
        )

    descricao_geral = "Presentes de casamento - Nicole & Bruno"

    preference_data = {
        "items": mp_items,
        "payer": {
            "name": nome,
            "email": email or None,
        },
        "back_urls": {
            "success": f"{SITE_URL}#presentes",
            "failure": f"{SITE_URL}#presentes",
            "pending": f"{SITE_URL}#presentes",
        },
        # auto_return removido para evitar erro "auto_return invalid"
        "metadata": {
            "guest_name": nome,
            "guest_email": email,
            "mensagem": mensagem,
        },
        "statement_descriptor": "NICOLE & BRUNO",
        "additional_info": descricao_geral,
    }

    print("[MP preference_data enviado]", preference_data)

    try:
        result = sdk.preference().create(preference_data)
    except Exception as e:
        print("Erro ao criar preferência no Mercado Pago (exception):", e)
        return jsonify({"erro": "Erro ao criar preferência de pagamento."}), 500

    status_code = result.get("status")
    response = result.get("response", {}) or {}

    print("[MP preference.create result]", result)

    init_point = response.get("init_point") or response.get("sandbox_init_point")
    preference_id = response.get("id")

    if status_code not in (200, 201) or not init_point:
        erro_msg = (
            response.get("message")
            or response.get("error")
            or "Falha ao criar preferência no Mercado Pago."
        )
        return jsonify({
            "erro": erro_msg,
            "mp_status": status_code,
            "mp_response": response,
        }), 500

    return jsonify(
        {
            "init_point": init_point,
            "preferenceId": preference_id,
        }
    ), 200


# ================== NOVO: LISTAR RECADOS VIA BANCO ==================

@app.route("/api/rsvp/messages", methods=["GET"])
def get_rsvp_messages():
    """
    Retorna a lista de recados (mensagem + nome) para o carrossel na página,
    usando APENAS convidados que:
      - vai_vir == True
      - mensagem não vazia
    """
    recs = (
        Rsvp.query
        .filter(Rsvp.vai_vir == True)  # somente quem VAI vir
        .filter(Rsvp.mensagem.isnot(None), Rsvp.mensagem != "")
        .order_by(Rsvp.created_at.desc())
        .limit(100)
        .all()
    )

    result = [
        {
            "nome": r.nome,
            "mensagem": r.mensagem,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in recs
    ]

    return jsonify(result), 200

@app.route("/api/admin/rsvp-clear", methods=["POST"])
def rsvp_clear():
    """
    Apaga TODOS os RSVPs do banco.
    Protegido por token simples: ?token=Admin7849 (ou o que estiver em ADMIN_TOKEN).
    USE COM CUIDADO – não tem undo.
    """
    token = request.args.get("token", "")
    if token != ADMIN_TOKEN:
        return jsonify({"erro": "Não autorizado"}), 401

    try:
        num_deleted = Rsvp.query.delete()
        db.session.commit()
        return jsonify({"status": "ok", "deleted": num_deleted}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": str(e)}), 500



# ================== RODAR SERVIDOR ==================

if __name__ == "__main__":
    print("MP_ACCESS_TOKEN presente?", bool(MP_ACCESS_TOKEN))
    print("ADMIN_TOKEN configurado?", bool(ADMIN_TOKEN))
    print("DATABASE_URL:", db_url)
    app.run(debug=True)
