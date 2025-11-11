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

#### Editar Usuário
```http
PUT /api/users/:id
Authorization: Bearer {token_admin}
Content-Type: application/json

{
  "name": "Nome Atualizado",
  "email": "novo@email.com",
  "phone": "(11) 99999-9999",
  "specialty": "Nova Especialidade",
  "address": {
    "street": "Nova Rua",
    "number": "456",
    "city": "São Paulo",
    "state": "SP"
  }
}
```

**Observações:**
- Não é possível alterar `role` (tipo de usuário)
- Não é possível alterar `password` por esta rota
- Validações de unicidade (email, CPF, CRM) são aplicadas

**Resposta:**
```json
{
  "message": "Usuário atualizado com sucesso",
  "user": {
    "id": "user_id",
    "name": "Nome Atualizado",
    "email": "novo@email.com",
    "role": "patient",
    "phone": "(11) 99999-9999"
  }
}
```

#### Excluir Usuário
```http
DELETE /api/users/:id
Authorization: Bearer {token_admin}
```

**Observações:**
- O admin não pode excluir a própria conta
- A exclusão é permanente

**Resposta:**
```json
{
  "message": "Usuário excluído com sucesso",
  "deletedUser": {
    "id": "user_id",
    "name": "João Silva",
    "email": "joao@email.com",
    "role": "patient"
  }
}
```

### Agenda Médica (Rotas protegidas - Apenas Médicos)

#### Visualizar Agenda com Filtros
```http
GET /api/appointments/schedule?filter=today
Authorization: Bearer {token_medico}
```

**Parâmetros de Query (opcionais):**
- `filter` - Filtro de período: `today`, `week`, `month`
- `startDate` - Data inicial (formato: YYYY-MM-DD) para período personalizado
- `endDate` - Data final (formato: YYYY-MM-DD) para período personalizado
- `status` - Filtrar por status: `confirmed`, `cancelled`, `completed`

**Exemplos:**
```http
# Agenda de hoje
GET /api/appointments/schedule?filter=today

# Agenda da semana (próximos 7 dias)
GET /api/appointments/schedule?filter=week

# Agenda do mês (próximos 30 dias)
GET /api/appointments/schedule?filter=month

# Período personalizado
GET /api/appointments/schedule?startDate=2024-01-01&endDate=2024-01-31

# Apenas consultas confirmadas desta semana
GET /api/appointments/schedule?filter=week&status=confirmed
```

**Resposta:**
```json
{
  "stats": {
    "total": 15,
    "confirmed": 12,
    "cancelled": 2,
    "completed": 1
  },
  "totalAppointments": 15,
  "groupedByDate": {
    "2024-01-15": [
      {
        "_id": "appointment_id",
        "appointmentDate": "2024-01-15T00:00:00.000Z",
        "appointmentTime": "09:00",
        "status": "confirmed",
        "patientId": {
          "name": "João Silva",
          "cpf": "12345678900",
          "phone": "(11) 98765-4321",
          "email": "joao@email.com"
        }
      }
    ]
  },
  "appointments": [...]
}
```

## 👥 Tipos de Usuário

### Admin
- ✅ Cadastrar pacientes e médicos
- ✅ Editar usuários (pacientes e médicos)
- ✅ Excluir usuários
- ✅ Visualizar todos os usuários
- ✅ Gerenciar o sistema completo

### Médico
- ✅ Visualizar agenda com filtros (hoje, semana, mês, personalizado)
- ✅ Gerenciar consultas
- ✅ Visualizar estatísticas da agenda
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
- ✅ **Edição de usuários** (pacientes e médicos)
- ✅ **Exclusão de usuários** com validações de segurança
- ✅ Sistema completo de agendamento de consultas
- ✅ Visualização de médicos por especialidade
- ✅ Visualização de horários disponíveis
- ✅ Cancelamento de consultas
- ✅ **Gestão de Agenda Médica** com filtros (hoje, semana, mês, personalizado)
- ✅ **Agrupamento de consultas por data**
- ✅ **Estatísticas da agenda** (confirmadas, canceladas, concluídas)

## 📄 Licença

ISC
