import os
import csv
from flask import Flask, request, jsonify
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
EMAIL_SENDER = os.getenv("EMAIL_SENDER", "noreply@casar.net.br")

# URL do site (usado nos e-mails de RSVP)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
SITE_URL = FRONTEND_URL  # mantém o nome antigo usado no código

# Mercado Pago
MP_ACCESS_TOKEN = os.getenv("MP_ACCESS_TOKEN", "")
sdk = mercadopago.SDK(MP_ACCESS_TOKEN) if MP_ACCESS_TOKEN else None

# Lista de e-mails dos noivos
GROOMS_EMAILS = [
    "brrunarib@gmail.com",
    "brunaaparecidaribeiro@hotmail.com",
    # "nicolerealeochove@hotmail.com"  # Uncomment when ready
]

CSV_FILE = "backend/rsvp_list.csv"


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
            row_email = row["Email"].strip().lower()
            latest[row_email] = row

    if email not in latest:
        return jsonify({"existe": False}), 200

    row = latest[email]

    return jsonify({
        "existe": True,
        "nome": row["Nome"],
        "email": row["Email"],
        "acompanhantes": row["Acompanhantes"],
        "criancas": row["Criancas"],
        "mensagem": row["Mensagem"],
        "vai_vir": row["Vai Vir"].lower() == "sim"
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
            row_email = row["Email"].strip().lower()
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
            row_email = row["Email"].strip().lower()
            latest_confirmations[row_email] = row

    # ========== LISTA FINAL FORMATADA ==========
    lista_confirmados = []
    total_pessoas = 0

    for row in latest_confirmations.values():
        if row["Vai Vir"].strip().lower() == "sim":
            nome_c = row["Nome"]
            adultos = int(row["Acompanhantes"] or 0)
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


# ========== MERCADO PAGO CHECKOUT API (PAYMENT BRICK) ==========

@app.route("/api/mp/payment", methods=["POST"])
def process_payment():
    """Endpoint chamado pelo Payment Brick do Mercado Pago.

    Espera um JSON no formato geral:
    {
      "transaction_amount": 123.45,
      "description": "Presentes de casamento",
      "token": "...",
      "installments": 1,
      "payment_method_id": "visa",
      "payer": {
        "email": "convidado@exemplo.com",
        "first_name": "Convidado"
      }
    }
    """

    if not sdk:
        return jsonify({"erro": "Mercado Pago não configurado no servidor."}), 500

    data = request.json or {}

    # Validações básicas
    try:
        amount = float(data.get("transaction_amount", 0))
    except (TypeError, ValueError):
        return jsonify({"erro": "Valor inválido de transaction_amount."}), 400

    token = data.get("token")
    payment_method_id = data.get("payment_method_id")
    installments = int(data.get("installments", 1) or 1)
    payer = data.get("payer", {}) or {}
    payer_email = payer.get("email")

    if amount <= 0 or not token or not payment_method_id or not payer_email:
        return jsonify({"erro": "Dados de pagamento incompletos."}), 400

    description = data.get("description", "Presentes de casamento - Nicole & Bruno")

    payment_data = {
        "transaction_amount": amount,
        "token": token,
        "description": description,
        "installments": installments,
        "payment_method_id": payment_method_id,
        "payer": {
            "email": payer_email,
            "first_name": payer.get("first_name", ""),
        },
        # ⚠️ Aqui podemos, no futuro, adicionar metadata, split, etc.
        # "metadata": {...}
    }

    try:
        result = sdk.payment().create(payment_data)
    except Exception as e:
        print("Erro ao criar pagamento no Mercado Pago:", e)
        return jsonify({"erro": "Erro ao processar o pagamento."}), 500

    payment = result.get("response", {}) or {}
    http_status = result.get("status", 200)

    # Aqui, no futuro, você pode:
    # - verificar se payment["status"] == "approved"
    # - enviar e-mail de "presente recebido" com SendGrid
    # - gravar no CSV/DB qual presente foi comprado

    return jsonify({
        "id": payment.get("id"),
        "status": payment.get("status"),
        "status_detail": payment.get("status_detail"),
        "transaction_amount": payment.get("transaction_amount"),
    }), http_status


# ========== RODAR SERVIDOR ==========

if __name__ == "__main__":
    app.run(debug=True)
