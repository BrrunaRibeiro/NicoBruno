from flask import Flask, request, jsonify
from flask_cors import CORS
import smtplib
from email.mime.text import MIMEText
import csv
import os

app = Flask(__name__)
CORS(app)

# ========== CONFIGURAÇÕES ==========
EMAIL_SENDER = "convite.nicolebruno@outlook.com"
EMAIL_PASSWORD = "senha-do-app-ou-normal"
SMTP_SERVER = "smtp.office365.com"
SMTP_PORT = 587

# Agora uma lista com os e-mails dos noivos
GROOMS_EMAILS = ["noivo@email.com", "noiva@email.com"]

SITE_URL = "http://localhost:3000"
CSV_FILE = "backend/rsvp_list.csv"

# ========== FUNÇÃO DE ENVIO (AGORA SUPORTA LISTA DE DESTINATÁRIOS) ==========
def enviar_email(destinatarios, assunto, corpo):
    if isinstance(destinatarios, str):
        destinatarios = [destinatarios]

    msg = MIMEText(corpo, "plain", "utf-8")
    msg["Subject"] = assunto
    msg["From"] = EMAIL_SENDER
    msg["To"] = ", ".join(destinatarios)

    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as smtp:
        smtp.starttls()
        smtp.login(EMAIL_SENDER, EMAIL_PASSWORD)
        smtp.send_message(msg)

# ========== ENDPOINT DE RSVP ==========
@app.route("/api/rsvp", methods=["POST"])
def confirmar_presenca():
    data = request.json
    nome = data.get("nome")
    convidados = int(data.get("convidados", 0))
    mensagem = data.get("mensagem", "")

    if not nome:
        return jsonify({"erro": "Nome é obrigatório"}), 400

    # Salvar confirmação no CSV
    os.makedirs("backend", exist_ok=True)
    is_new_file = not os.path.exists(CSV_FILE)
    with open(CSV_FILE, "a", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        if is_new_file:
            writer.writerow(["Nome", "Convidados", "Mensagem"])
        writer.writerow([nome, convidados, mensagem])

    # Ler confirmações
    total_pessoas = 0
    lista_confirmados = []
    with open(CSV_FILE, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            total_pessoas += 1 + int(row["Convidados"])
            lista_confirmados.append(f"- {row['Nome']} (+{row['Convidados']})")

    # Email para os noivos
    corpo_noivos = (
        f"🎉 YEYYY! {nome} confirmou presença com mais {convidados} acompanhante(s)!\n\n"
        f"📋 Lista de confirmados até agora:\n" +
        "\n".join(lista_confirmados) +
        f"\n\n👥 Total de pessoas esperadas: {total_pessoas}"
    )
    enviar_email(GROOMS_EMAILS, "Nova Confirmação de Presença ✨", corpo_noivos)

    # Email para o convidado
    corpo_convidado = (
        f"Olá {nome},\n\n"
        "Obrigado por confirmar presença no casamento de Nicole e Bruno! 💍\n"
        "Estamos muito felizes em te receber nesse momento tão especial.\n\n"
        "Se você ainda não deixou seu presente e quiser fazer isso, clique no link abaixo:\n"
        f"{SITE_URL}#presentes\n\n"
        "Com carinho,\nNicole & Bruno"
    )
    enviar_email(nome, "Obrigado por confirmar presença!", corpo_convidado)

    return jsonify({"status": "ok", "mensagem": "Confirmação registrada com sucesso"})


# ========== RODAR SERVIDOR ==========
if __name__ == "__main__":
    app.run(debug=True)
