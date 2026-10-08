from database.conexao import Conexao
from flask import Flask, render_template, request, redirect, session
import bcrypt

class Usuario():
    def validar_usuario(email_input: str, senha_input: str):
        '''Função para verificar se o usuario existe e retorna um bool'''
        conexao, cursor = Conexao.conectar()

        # Buscando a senha hash filtrando o email
        cursor.execute('SELECT senha_hash FROM usuarios WHERE email = %s', [email_input])
        resultado_senha = cursor.fetchone() 
        
        conexao.close()
        cursor.close()

        # Se o email nao existir no banco retorna falso
        if resultado_senha is None:
            return False

        senha_hash = resultado_senha[0]
        try:
            # O bcrypt precisa que os valores estejam em formato de bytes (.encode('utf-8'))
            senha_bytes = senha_input.encode('utf-8')
            hash_bytes = senha_hash.encode('utf-8')

            # compara a senha digitada com o hash salvo
            if bcrypt.checkpw(senha_bytes, hash_bytes):
                return True
            else:
                return False
                
        except Exception as erro:
            print({erro})
            return False
                