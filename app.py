from flask import Flask, render_template, request, redirect, session, flash, url_for
from database.conexao import Conexao
from model.usuarios import Usuario
from model.extrato import Extrato


app = Flask(__name__)
app.secret_key = "duckfy999"


@app.get("/simulador")
def simulador_patrimonio():
    return render_template("simulador.html")



if __name__ == "__main__":
    app.run(debug=True)
