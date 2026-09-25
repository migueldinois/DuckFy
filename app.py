from flask import Flask, render_template


app = Flask(__name__)


@app.get("/")
def inicio():
    return perfil()


@app.get("/perfil")
def perfil():
    return render_template("perfil.html")


@app.get("/editar-perfil")
def editar_perfil():
    return render_template("editar_perfil.html")

@app.get("/cadastro")
def cadastro():
    return render_template("cadastro.html")


if __name__ == "__main__":
    app.run(debug=True)
    