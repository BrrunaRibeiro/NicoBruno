
import os
import csv
import smtplib
from email.mime.text import MIMEText

from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# ========== CONFIGURAÇÕES ==========
EMAIL_SENDER = "convite.nicolebruno@outlook.com"
EMAIL_PASSWORD = "senha-do-app-ou-normal"
SMTP_SERVER = "smtp.office365.com"
SMTP_PORT = 587

# Lista de e-mails dos noivos
GROOMS_EMAILS = ["brrunarib@gmail.com", "noiva@email.com"]

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
@app.route("/api/rsvp", methods=["POST"])
def confirmar_presenca():
    data = request.json
    nome = data.get("nome")
    acompanhantes = int(data.get("acompanhantes", 0))
    mensagem = data.get("mensagem", "")
    vai_vir = data.get("vai_vir", True)  # True if attending, False if not

    if not nome:
        return jsonify({"erro": "Nome é obrigatório"}), 400

    # Salvar confirmação no CSV
    os.makedirs("backend", exist_ok=True)
    is_new_file = not os.path.exists(CSV_FILE)
    with open(CSV_FILE, "a", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        if is_new_file:
            writer.writerow(["Nome", "Acompanhantes", "Mensagem", "Vai Vir"])
        writer.writerow([nome, acompanhantes, mensagem, "Sim" if vai_vir else "Não"])

    # Ler confirmações
    total_pessoas = 0
    lista_confirmados = []
    with open(CSV_FILE, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row["Vai Vir"] == "Sim":
                total_pessoas += 1 + int(row["Acompanhantes"])
                lista_confirmados.append(f"- {row['Nome']} (+{row['Acompanhantes']})")

    # Email para os noivos
    if vai_vir:
        corpo_noivos = (
            f"🎉 YEYYY! {nome} confirmou presença com mais {acompanhantes} acompanhante(s)!\n\n"
            f"📋 Lista de confirmados até agora:\n" +
            "\n".join(lista_confirmados) +
            f"\n\n👥 Total de pessoas esperadas: {total_pessoas}"
        )
        enviar_email(GROOMS_EMAILS, "Nova Confirmação de Presença ✨", corpo_noivos)

    # Email para o convidado
    corpo_convidado = (
        f"Olá {nome},\n\n"
        f"{'Obrigado por confirmar presença' if vai_vir else 'Lamentamos que você não possa comparecer'} no casamento de Nicole e Bruno! 💍\n"
        "Estamos muito felizes em te receber nesse momento tão especial.\n\n"
        "Se você ainda não deixou seu presente e quiser fazer isso, clique no link abaixo:\n"
        f"{SITE_URL}#presentes\n\n"
        "Com carinho,\nNicole & Bruno"
    )
    enviar_email(nome, "Obrigado por confirmar presença!" if vai_vir else "Sentimos sua falta!", corpo_convidado)

    return jsonify({"status": "ok", "mensagem": "Confirmação registrada com sucesso"})


# ========== RODAR SERVIDOR ==========
if __name__ == "__main__":
    app.run(debug=True)
