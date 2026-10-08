from flask import Flask, render_template


app = Flask(__name__)


@app.get("/")
def inicio():
    return simulador_patrimonio()


@app.get("/simulador")
def simulador_patrimonio():
    return render_template("duckfy_simulador_patrimonio.html")



if __name__ == "__main__":
    app.run(debug=True)
    