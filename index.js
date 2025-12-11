const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const QRCode = require('qrcode');

// --- IMPORTANDO SEUS ARQUIVOS DE CONFIGURAÇÃO ---
const campanhas = require('./config'); // Puxa os dados do config.js
const { htmlTV, htmlMobile, htmlAdmin } = require('./templates'); // Puxa o visual do templates.js

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(__dirname));
app.use(express.static('public'));

let historicoVendas = []; 
let slideAtual = 0;

// Preparando os dados (Adicionando contadores automaticamente)
campanhas.forEach(c => {
    if(!c.totalResgates) c.totalResgates = 0;
    if(!c.resgatesPorHora) c.resgatesPorHora = new Array(24).fill(0);
    if(!c.ultimoCupom) c.ultimoCupom = "Nenhum";
    if(!c.ultimaHora) c.ultimaHora = "--:--";
});

// Rotação dos Slides
setInterval(() => {
    slideAtual++;
    if (slideAtual >= campanhas.length) slideAtual = 0;
    io.emit('trocar_slide', campanhas[slideAtual]);
}, 15000);

function gerarCodigo(prefixo) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 4; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    return `${prefixo}-${result}`;
}

// Rotas
app.get('/baixar-relatorio', (req, res) => {
    let csv = "\uFEFFDATA,HORA,PRODUTO,CODIGO,TIPO_PREMIO\n";
    historicoVendas.forEach(h => {
        csv += `${h.data},${h.hora},${h.produto},${h.codigo},${h.tipo}\n`;
    });
    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.attachment('relatorio_ampm.csv');
    res.send(csv);
});

app.get('/tv', (req, res) => res.send(htmlTV));
app.get('/admin', (req, res) => res.send(htmlAdmin));
app.get('/mobile', (req, res) => res.send(htmlMobile));
app.get('/', (req, res) => res.redirect('/tv'));
app.get('/qrcode', (req, res) => { const url = `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}/mobile`; QRCode.toDataURL(url, (e, s) => res.send(s)); });

// Sistema
io.on('connection', (socket) => {
    socket.emit('trocar_slide', campanhas[slideAtual]);
    socket.emit('dados_admin', campanhas);
    socket.on('pedir_atualizacao', () => { socket.emit('trocar_slide', campanhas[slideAtual]); });
    
    socket.on('resgatar_oferta', (id) => {
        let camp = campanhas[id];
        if (camp && camp.qtd > 0) {
            camp.qtd--;
            camp.totalResgates++;
            const agora = new Date();
            agora.setHours(agora.getHours() - 3);
            const horaAtual = agora.getHours();
            if(horaAtual >= 0 && horaAtual <= 23) camp.resgatesPorHora[horaAtual]++;
            
            let cod = gerarCodigo(camp.prefixo);
            let horaStr = agora.toLocaleTimeString('pt-BR');
            let isGold = false; 
            let tipoPremio = "Normal";
            let nomeFinal = camp.nome;
            let cor1 = camp.corPrincipal;

            if (camp.ehSorteio) {
                const sorte = Math.floor(Math.random() * 100) + 1;
                if (sorte > 95) { 
                    isGold = true; nomeFinal = "PARABÉNS! 50% OFF"; tipoPremio="OURO";
                } else { 
                    cor1 = '#cccccc'; nomeFinal = "Ganhou: 2% OFF"; tipoPremio="BRONZE";
                }
            }

            historicoVendas.push({
                data: agora.toLocaleDateString('pt-BR'),
                hora: horaStr,
                produto: nomeFinal,
                codigo: cod,
                tipo: tipoPremio
            });

            io.emit('atualizar_qtd', camp);
            if(slideAtual === id) io.emit('trocar_slide', camp);
            socket.emit('sucesso', { codigo: cod, produto: nomeFinal, corPrincipal: cor1, isGold: isGold });
            io.emit('dados_admin', campanhas);
        }
    });
    socket.on('admin_update', (d) => { campanhas[d.id].qtd = parseInt(d.qtd); io.emit('dados_admin', campanhas); if(slideAtual === d.id) io.emit('trocar_slide', campanhas[d.id]); });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`AMPM rodando na porta ${PORT}`));
