from model.progresso import Progresso


class UsuarioBadge:
    @staticmethod
    def listar_conquistas_usuario(id_usuario):
        # Centraliza aqui a atualização e a listagem das conquistas do usuário.
        return Progresso.sincronizar_conquistas(id_usuario)
