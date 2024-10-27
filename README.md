# Projeto de Transações Bancárias

Este é um projeto de exemplo para um sistema de transações bancárias utilizando NestJS, Prisma, Redis, e PostgreSQL. O
projeto permite criar, transferir, depositar e sacar valores de contas bancárias.

## Sumário

- [Requisitos](#requisitos)
- [Configuração do Projeto](#configuração-do-projeto)
- [Executando o Projeto](#executando-o-projeto)
- [Executando os Testes](#executando-os-testes)

## Requisitos

Certifique-se de ter os seguintes itens instalados em seu sistema:

- Node.js (versão 14 ou superior)
- PostgreSQL
- pnpm (gerenciador de pacotes)

## Configuração do Projeto

1. **Clone o repositório**:
   ```bash
   git clone https://github.com/uricholiveira/Tech.Challange.12
   cd Tech.Challange.12
   ```

2. **Instale as dependências**:
   ```bash
   pnpm install
   ```

3. **Configuração do Banco de Dados**:
   Certifique-se de que o PostgreSQL esteja em execução e crie um banco de dados para desenvolvimento e teste.

4. **Variáveis de Ambiente**:
   Crie um arquivo `.env` na raiz do projeto com a URL do banco de dados de desenvolvimento:

   ```plaintext
   DATABASE_URL="postgresql://user:password@localhost:5432/mydatabase"
   
   ```

5. **Migração do Banco de Dados**:
   Execute a migração do banco de dados para configurar as tabelas conforme definido no esquema do Prisma:

   ```bash
   pnpm prisma generate && pnpm prisma db push
   ```

## Executando o Projeto

Para iniciar o servidor em desenvolvimento:

```bash
pnpm start:dev
```

O servidor estará disponível em `http://localhost:3000`.

## Executando os Testes

Para executar todos os testes:

```bash
pnpm test
```

## Testes de concorrência

Os testes de concorrência estão em src/transaction/transaction.service.spec.ts.

## Uso do Docker

Para facilitar a configuração do ambiente de desenvolvimento, você pode usar o `docker-compose` fornecido no diretório
`./infrastructure`. Este `docker-compose.yml` configurará e iniciará os contêineres necessários para a aplicação,
incluindo o banco de dados PostgreSQL.

1. **Na pasta raiz, inicie os contêineres com o `docker-compose`**:
   ```bash
   docker-compose -f infrastructure/docker-compose.yaml up
   ```

Isso iniciará todos os serviços definidos no arquivo `docker-compose.yml`. Você pode então acessar o swagger da
aplicação em
`http://localhost:3000/api`.