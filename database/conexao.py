import mysql.connector
tipo_conexao = "LOCAL"
class Conexao():
    @staticmethod
    def conectar():
        if tipo_conexao == "LOCAL":
            conexao = mysql.connector.connect(
            host="localhost",
            port=3306,
            user="root",
            password="root",
            database="duckfy")
        else:
            conexao = mysql.connector.connect(
            host="",
            port=15558,
            user="",
            password="",
            database="")

        # Vai entregar coluna nome é esse valor, ao inves de dar tudo separado em ma lista sem direcionamento 
        cursor = conexao.cursor(dictionary=True)
        return conexao, cursor