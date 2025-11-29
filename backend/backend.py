import os
import csv
import smtplib
from email.mime.text import MIMEText
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# ========== CONFIGURAÇÕES ==========
EMAIL_SENDER = "brrunarib@gmail.com"
EMAIL_PASSWORD = "gblm jpvi znep mgac"  # Gmail App Password
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587

# Lista de e-mails dos noivos
GROOMS_EMAILS = [
    "brrunarib@gmail.com",
    "brunaaparecidaribeiro@hotmail.com",
    # "nicolerealeochove@hotmail.com"  # Uncomment when ready
]

SITE_URL = "http://localhost:3000"
CSV_FILE = "backend/rsvp_list.csv"

# ========== FUNÇÃO DE ENVIO ==========
def enviar_email(destinatarios, assunto, corpo):
    if isinstance(destinatarios, str):
        destinatarios = [destinatarios]

    msg = MIMEText(corpo, "plain", "utf-8")
    msg["Subject"] = assunto
    msg["From"] = EMAIL_SENDER
    msg["To"] = ", ".join(destinatarios)

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as smtp:
            smtp.starttls()
            smtp.login(EMAIL_SENDER, EMAIL_PASSWORD)
            smtp.send_message(msg)
    except Exception as e:
        print(f"Erro ao enviar e-mail: {e}")

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
    acompanhantes = int(data.get("acompanhantes", 0))
    criancas = int(data.get("criancas", 0))
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
            adultos = int(row["Acompanhantes"])
            cri = int(row.get("Criancas", 0))

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


# ========== RODAR SERVIDOR ==========
if __name__ == "__main__":
    app.run(debug=True)
