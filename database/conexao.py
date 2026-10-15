import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

class Conexao():
    @staticmethod
    def conectar():
        BD_AMBIENTE = os.getenv("BD_AMBIENTE", "local")
        if BD_AMBIENTE == "local":
            conexao = mysql.connector.connect(
            host="localhost",
            port=3306,
            user="root",
            password="root",
            database="duckfy")
        elif BD_AMBIENTE == "online":
            conexao = mysql.connector.connect(
            host= os.getenv("BD_HOST"),
            port= os.getenv("BD_PORTA"),
            user= os.getenv("BD_USUARIO"),
            password= os.getenv("BD_SENHA"),
            database= os.getenv("BD_DATABASE"))

        # Vai entregar coluna nome é esse valor, ao inves de dar tudo separado em ma lista sem direcionamento 
        cursor = conexao.cursor(dictionary=True)
        return conexao, cursor