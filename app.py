from flask import Flask, render_template, request, redirect, session, flash, url_for
from database.conexao import Conexao
from model.usuarios import Usuario
from model.extrato import Extrato
from model.simulador import SimuladorPatrimonio


app = Flask(__name__)
app.secret_key = "duckfy999"

@app.route("/simulador", methods=["GET", "POST"])
def tela_simulador():
    aporte_inicial = 0.0
    aporte_mensal = 0.0
    anos = 5

    if request.method == "POST":
        try:
            aporte_inicial = float(request.form.get("aporte_inicial", 0.0) or 0.0)
            aporte_mensal = float(request.form.get("aporte_mensal", 0.0) or 0.0)
            anos = int(request.form.get("anos", 5))
        except ValueError:
            pass

    # A função irá buscar automaticamente a Selic no BCB se taxa_anual for None
    resultado = SimuladorPatrimonio.calcular_simulacao(
        aporte_inicial=aporte_inicial,
        aporte_mensal=aporte_mensal,
        anos=anos
    )

    return render_template(
        "simulador.html",
        resultado=resultado,
        aporte_inicial=aporte_inicial,
        aporte_mensal=aporte_mensal,
        anos=anos
    )

    return render_template("simulador.html")




if __name__ == "__main__":
    app.run(debug=True)
