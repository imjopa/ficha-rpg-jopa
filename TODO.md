# TODO: Deploy do Projeto RPG FichaCandelaJopa

## 1. Preparar Backend para Render
- [x] Adicionar script "build" vazio no backend/package.json
- [ ] Configurar variáveis de ambiente no Render: MONGO_URI, JWT_SECRET, PORT
- [ ] Deploy backend como Web Service no Render

## 2. Preparar Frontend para Netlify
- [x] Editar frontend/src/services/api.js para usar REACT_APP_API_URL
- [x] Build o app React
- [ ] Configurar REACT_APP_API_URL no Netlify apontando para backend no Render
- [ ] Deploy frontend no Netlify

## 3. Testes Finais
- [ ] Testar aplicação após deploy
- [ ] Verificar logs para erros
