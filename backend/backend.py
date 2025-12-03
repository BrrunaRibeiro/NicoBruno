import os
import csv
from io import StringIO   # NEW
from flask import Flask, request, jsonify, Response  # Response added
from flask_cors import CORS
from dotenv import load_dotenv

# New: SendGrid + Mercado Pago
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import mercadopago

# Carrega variáveis do .env em desenvolvimento
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

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
    "brrunarib@gmail.com",
    "brunaaparecidaribeiro@hotmail.com",
    # "nicolerealeochove@hotmail.com"  # Uncomment when ready
]

CSV_FILE = "backend/rsvp_list.csv"


# ========== HELPERS PARA LER EMAIL DO CSV ==========

def get_row_email(row):
    """
    Tenta encontrar o campo de e-mail em uma linha do CSV,
    independentemente de variações como 'email', 'E-mail', 'E mail', etc.

    Retorna o e-mail em minúsculas e sem espaços ao redor, ou None se não encontrar.
    """
    email_key = next(
        (
            k
            for k in row.keys()
            if isinstance(k, str)
            and k.strip().lower() in ("email", "e-mail", "e_mail", "e mail")
        ),
        None,
    )

    if not email_key:
        return None

    cell = row.get(email_key)
    if cell is None:
        return None

    return str(cell).strip().lower()


# ========== FUNÇÃO DE ENVIO (AGORA COM SENDGRID) ==========

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


# ========== ENDPOINT PARA BUSCAR RSVP EXISTENTE ==========

@app.route("/api/rsvp", methods=["GET"])
def get_rsvp():
    email = request.args.get("email", "").strip().lower()
    if not email:
        return jsonify({"erro": "E-mail não fornecido"}), 400

    if not os.path.exists(CSV_FILE):
        return jsonify({"existe": False}), 200

    latest = {}
    with open(CSV_FILE, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            row_email = get_row_email(row)
            if not row_email:
                continue
            latest[row_email] = row

    if email not in latest:
        return jsonify({"existe": False}), 200

    row = latest[email]

    # Para o campo "email" devolvemos o próprio e-mail normalizado (email da query),
    # assim não dependemos do nome exato da coluna no CSV.
    return jsonify({
        "existe": True,
        "nome": row.get("Nome", ""),
        "email": email,
        "acompanhantes": row.get("Acompanhantes", ""),
        "criancas": row.get("Criancas", ""),
        "mensagem": row.get("Mensagem", ""),
        "vai_vir": str(row.get("Vai Vir", "")).lower() == "sim"
    }), 200


# ========== ENDPOINT DE RSVP (CRIAR / ATUALIZAR) ==========

@app.route("/api/rsvp", methods=["POST", "PUT"])
def confirmar_presenca():
    data = request.json
    nome = data.get("nome")
    email = data.get("email", "").strip().lower()
    acompanhantes = int(data.get("acompanhantes", 0) or 0)
    criancas = int(data.get("criancas", 0) or 0)
    mensagem = data.get("mensagem", "")
    vai_vir = data.get("vai_vir", True)
    metodo = request.method

    if not nome or not email:
        return jsonify({"erro": "Nome e e-mail são obrigatórios"}), 400

    # ========== CRIAR ARQUIVO SE NÃO EXISTE ==========
    os.makedirs("backend", exist_ok=True)
    if not os.path.exists(CSV_FILE):
        with open(CSV_FILE, "w", encoding="utf-8", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["Nome", "Email", "Acompanhantes", "Criancas", "Mensagem", "Vai Vir"])

    # ========== LER CONFIRMAÇÕES EXISTENTES ==========
    latest = {}
    with open(CSV_FILE, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            row_email = get_row_email(row)
            if not row_email:
                continue
            latest[row_email] = row

    # ========== CHECAR SE EMAIL EXISTE NO POST ==========
    if metodo == "POST" and email in latest:
        return jsonify({"erro": "Email já cadastrado", "code": 409}), 409

    # ========== ADICIONAR NOVA LINHA NO CSV ==========
    with open(CSV_FILE, "a", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([nome, email, acompanhantes, criancas, mensagem, "Sim" if vai_vir else "Não"])

    # ========== RECRIAR LISTA FINAL ==========
    latest_confirmations = {}
    with open(CSV_FILE, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            row_email = get_row_email(row)
            if not row_email:
                continue
            latest_confirmations[row_email] = row

    # ========== LISTA FINAL FORMATADA ==========
    lista_confirmados = []
    total_pessoas = 0

    for row in latest_confirmations.values():
        if str(row.get("Vai Vir", "")).strip().lower() == "sim":
            nome_c = row.get("Nome", "")
            adultos = int(row.get("Acompanhantes", 0) or 0)
            cri = int(row.get("Criancas", 0) or 0)

            partes = []
            if adultos > 1:
                partes.append(f"{adultos - 1} acompanhante(s) adulto")
            if cri > 0:
                partes.append(f"{cri} acompanhante(s) infantil")

            if partes:
                descricao = f"💌 {nome_c}, com " + " e ".join(partes)
            else:
                descricao = f"💌 {nome_c}"

            lista_confirmados.append(descricao)
            total_pessoas += adultos + cri

    # ========== EMAIL PARA OS NOIVOS ==========
    if vai_vir:
        if metodo == "PUT":
            assunto = "Alteração na confirmação 💡"
            corpo = f"🔄 {nome} alterou sua confirmação e agora VAI comparecer com {acompanhantes} adulto(s) e {criancas} criança(s)."
        else:
            assunto = "Nova Confirmação de Presença ✨"
            corpo = f"🎉 YEYYY! {nome} confirmou presença com {acompanhantes} adulto(s) e {criancas} criança(s)!"
    else:
        if metodo == "PUT":
            assunto = "Alteração de RSVP ❌"
            corpo = f"🔄 {nome} alterou sua confirmação e agora NÃO poderá comparecer."
        else:
            assunto = "Confirmação negativa recebida ❌"
            corpo = f"Que pena, {nome} não poderá comparecer."

    corpo += (
        "\n\n📋 Lista atualizada de confirmados:\n"
        + "\n".join(lista_confirmados)
        + f"\n\n👥 Total de pessoas esperadas: {total_pessoas}"
    )

    enviar_email(GROOMS_EMAILS, assunto, corpo)

    # ========== EMAIL PARA O CONVIDADO ==========
    corpo_convidado = (
        f"Olá {nome},\n\n"
        f"{'Estamos muito felizes com sua resposta!' if vai_vir else 'Obrigada por nos informar...'}\n\n"
        f"{'Obrigado por confirmar sua presença' if vai_vir else 'Sentiremos sua falta'} no nosso casamento! 💍\n\n"
        f"Caso queira deixar-nos um presente, acesse:\n{SITE_URL}#presentes\n\n"
        "Com carinho,\nNicole & Bruno ✨"
    )

    enviar_email(
        email,
        "Obrigado por confirmar sua presença!" if vai_vir else "Sentiremos sua falta!",
        corpo_convidado
    )

    return jsonify({"status": "ok", "mensagem": "Confirmação registrada com sucesso"}), 200


# ========== NOVO: EXPORTAR RSVPs (APENAS ADMIN) ==========

@app.route("/api/admin/rsvp-export", methods=["GET"])
def rsvp_export():
    """
    Exporta a lista de RSVPs como CSV.

    Protegido por token simples: ?token=Admin7849
    (na produção usaremos o valor de ADMIN_TOKEN).
    """
    token = request.args.get("token", "")

    if token != ADMIN_TOKEN:
        return jsonify({"erro": "Não autorizado"}), 401

    if not os.path.exists(CSV_FILE):
        return jsonify({"erro": "Ainda não há RSVPs salvos."}), 404

    # Lê o CSV e mantém apenas a última linha por email (igual ao resto do código)
    latest = {}
    with open(CSV_FILE, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            row_email = get_row_email(row)
            if not row_email:
                continue
            latest[row_email] = row

    # Gera um CSV em memória
    output = StringIO()
    fieldnames = ["Nome", "Email", "Acompanhantes", "Criancas", "Mensagem", "Vai Vir"]
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()

    for row in latest.values():
        writer.writerow({
            "Nome": row.get("Nome", ""),
            # aqui usamos row.get("Email", "") pois o CSV de saída SEMPRE terá coluna "Email"
            "Email": row.get("Email", ""),
            "Acompanhantes": row.get("Acompanhantes", ""),
            "Criancas": row.get("Criancas", ""),
            "Mensagem": row.get("Mensagem", ""),
            "Vai Vir": row.get("Vai Vir", ""),
        })

    csv_data = output.getvalue()

    return Response(
        csv_data,
        mimetype="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=rsvp_export.csv"
        },
    )


# ========== MERCADO PAGO CHECKOUT PRO (REDIRECT) ==========

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

    # result geralmente tem: {"status": 201, "response": {...}}
    status_code = result.get("status")
    response = result.get("response", {}) or {}

    print("[MP preference.create result]", result)  # log completo no console

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


# ========== RODAR SERVIDOR ==========

if __name__ == "__main__":
  print("MP_ACCESS_TOKEN presente?", bool(MP_ACCESS_TOKEN))
  print("ADMIN_TOKEN configurado?", bool(ADMIN_TOKEN))
  app.run(debug=True)
