# Planify - Sistema de Agendamento para Consultório

Sistema de gerenciamento de consultas médicas com cadastro de pacientes, médicos e autenticação diferenciada por perfil.

## 🚀 Tecnologias

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **MongoDB** - Banco de dados
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticação
- **bcrypt** - Hash de senhas

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
# Crie um arquivo .env na pasta backend/ com:
PORT=5000
MONGO_URI=sua_url_do_mongodb
JWT_SECRET=sua_chave_secreta
```

## 🏃 Executar

```bash
# Modo desenvolvimento (com nodemon)
npm run dev

# Modo produção
npm start
```

## 📚 API Endpoints

### Autenticação

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@email.com",
  "password": "senha123"
}
```

**Resposta:**
```json
{
  "token": "jwt_token_aqui",
  "user": {
    "id": "user_id",
    "name": "Nome do Usuário",
    "email": "usuario@email.com",
    "role": "patient" // ou "doctor" ou "admin"
  }
}
```

#### Obter Dados do Usuário Logado
```http
GET /api/auth/me
Authorization: Bearer {token}
```

### Usuários (Rotas protegidas - Apenas Admin)

#### Cadastrar Paciente
```http
POST /api/users/patients
Authorization: Bearer {token_admin}
Content-Type: application/json

{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "senha123",
  "cpf": "12345678900",
  "phone": "(11) 98765-4321",
  "birthDate": "1990-05-15",
  "address": {
    "street": "Rua Exemplo",
    "number": "123",
    "complement": "Apt 45",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01234-567"
  }
}
```

#### Cadastrar Médico
```http
POST /api/users/doctors
Authorization: Bearer {token_admin}
Content-Type: application/json

{
  "name": "Dra. Maria Santos",
  "email": "maria@email.com",
  "password": "senha123",
  "crm": "123456",
  "specialty": "Cardiologia",
  "phone": "(11) 91234-5678",
  "schedule": {
    "segunda": [
      { "startTime": "08:00", "endTime": "12:00" },
      { "startTime": "14:00", "endTime": "18:00" }
    ],
    "terca": [
      { "startTime": "08:00", "endTime": "12:00" }
    ]
  }
}
```

#### Listar Todos os Usuários
```http
GET /api/users
Authorization: Bearer {token_admin}
```

#### Listar Médicos (Rota pública)
```http
GET /api/users/doctors/list
```

#### Buscar Usuário por ID
```http
GET /api/users/:id
Authorization: Bearer {token_admin}
```

## 👥 Tipos de Usuário

### Admin
- Cadastrar pacientes
- Cadastrar médicos
- Visualizar todos os usuários
- Gerenciar o sistema

### Médico
- Visualizar agenda
- Gerenciar consultas
- Atualizar disponibilidade

### Paciente
- Visualizar médicos disponíveis
- Agendar consultas
- Visualizar histórico

## 🔐 Autenticação

O sistema usa **JWT (JSON Web Tokens)** para autenticação. Após o login, inclua o token em todas as requisições protegidas:

```
Authorization: Bearer {seu_token_aqui}
```

## 📝 Modelos de Dados

### User (Usuário)
- `name` - Nome completo
- `email` - Email único
- `password` - Senha (hasheada)
- `role` - Tipo: patient, doctor ou admin
- `cpf` - CPF (apenas pacientes)
- `phone` - Telefone
- `birthDate` - Data de nascimento (pacientes)
- `address` - Endereço completo (pacientes)
- `crm` - CRM (apenas médicos)
- `specialty` - Especialidade (médicos)
- `schedule` - Agenda de atendimento (médicos)

## 🔒 Segurança

- Senhas hasheadas com bcrypt
- Autenticação via JWT
- Rotas protegidas por middleware
- Validação de permissões por role

## 📂 Estrutura do Projeto

```
Planify/
├── backend/
│   ├── config/
│   │   └── db.js              # Configuração MongoDB
│   ├── controllers/
│   │   ├── authController.js   # Lógica de autenticação
│   │   └── userController.js   # Lógica de usuários
│   ├── middleware/
│   │   └── authMiddleware.js   # Middleware de autenticação
│   ├── models/
│   │   ├── AppointmentModel.js # Modelo de consultas
│   │   ├── AvailabilityModel.js # Modelo de disponibilidade
│   │   └── UserModel.js        # Modelo de usuários
│   ├── routes/
│   │   ├── authRoutes.js       # Rotas de autenticação
│   │   └── userRoutes.js       # Rotas de usuários
│   ├── .env                    # Variáveis de ambiente
│   └── index.js                # Ponto de entrada
├── package.json
└── README.md
```

## ✅ Funcionalidades Implementadas

- ✅ Sistema de autenticação diferenciado (admin, médico, paciente)
- ✅ Cadastro de pacientes e médicos
- ✅ Sistema completo de agendamento de consultas
- ✅ Visualização de médicos por especialidade
- ✅ Visualização de horários disponíveis
- ✅ Cancelamento de consultas

## 📋 Próximas Funcionalidades

- [ ] Notificações por email
- [ ] Dashboard para médicos e admin
- [ ] Histórico de consultas e prontuário
- [ ] Relatórios e estatísticas
- [ ] Sistema de pagamento

## 📄 Licença

ISC
