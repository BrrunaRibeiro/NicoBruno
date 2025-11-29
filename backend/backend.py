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

# ========== ENDPOINT DE RSVP ==========
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

    os.makedirs("backend", exist_ok=True)
    is_new_file = not os.path.exists(CSV_FILE)
    with open(CSV_FILE, "a", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        if is_new_file:
            writer.writerow(["Nome", "Email", "Acompanhantes", "Criancas", "Mensagem", "Vai Vir"])
        writer.writerow([nome, email, acompanhantes, criancas, mensagem, "Sim" if vai_vir else "Não"])

    # ========== FILTRAR RESPOSTAS MAIS RECENTES ==========
    latest_confirmations = {}
    with open(CSV_FILE, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            row_email = row["Email"].strip().lower()
            latest_confirmations[row_email] = row

    # ========== LISTA DE CONFIRMADOS ==========
    lista_confirmados = []
    total_pessoas = 0
    for row in latest_confirmations.values():
        if row["Vai Vir"].strip().lower() == "sim":
            nome = row["Nome"]
            adultos = int(row["Acompanhantes"])
            criancas = int(row.get("Criancas", 0))

            partes = []
            if adultos > 1:
                partes.append(f"{adultos - 1} acompanhante(s) adulto")
            if criancas > 0:
                partes.append(f"{criancas} acompanhante(s) infantil")

            if partes:
                descricao = f"💌 {nome}, com " + " e ".join(partes)
            else:
                descricao = f"💌 {nome}"

            lista_confirmados.append(descricao)
            total_pessoas += adultos + criancas

    # ========== PRINT PARA CONSOLE ==========
    print("📋 Lista atualizada de confirmados:")
    for pessoa in lista_confirmados:
        print(pessoa)
    print(f"👥 Total confirmado: {total_pessoas} pessoas\n")

    # ========== MENSAGEM PARA OS NOIVOS ==========
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
    enviar_email(email, "Obrigado por confirmar sua presença!" if vai_vir else "Sentiremos sua falta!", corpo_convidado)

    return jsonify({"status": "ok", "mensagem": "Confirmação registrada com sucesso"})


# ========== RODAR SERVIDOR ==========
if __name__ == "__main__":
    app.run(debug=True)
