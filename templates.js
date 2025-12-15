// ... (Todo o código HTML da TV, Mobile e Caixa vai aqui em cima) ...

// --- PAINEL DO GERENTE (ADMIN) ---
const htmlAdmin = `
<!DOCTYPE html><html><meta name="viewport" content="width=device-width, initial-scale=1"><body style="font-family:Arial; padding:20px; background:#222; color:white;">
<h1>💼 Painel Gerencial AMPM</h1>
<div style="display:flex; gap:20px; flex-wrap:wrap;">
    <div style="flex:1; min-width:300px; padding:15px; background:#333; border-radius:10px; border:1px solid #555;">
        <h3>📊 Relatório Completo</h3>
        <p>Baixe para ver todas as validações.</p>
        <a href="/baixar-relatorio" target="_blank"><button style="padding:10px 20px; background:#009933; color:white; border:none; border-radius:5px; font-weight:bold; cursor:pointer;">📥 BAIXAR EXCEL</button></a>
    </div>
    <div style="flex:1; min-width:300px;">
        <h3>📦 Controle de Estoque</h3>
        <div id="paineis"></div>
    </div>
</div>
<h3>🕒 Últimos Cupons (Tempo Real)</h3>
<div style="overflow-x:auto;"><table style="width:100%; border-collapse:collapse; background:#444; color:white; border-radius:10px; overflow:hidden;"><thead style="background:#003399;"><tr><th style="padding:10px;">Hora Emissão</th><th style="padding:10px;">Cód</th><th style="padding:10px;">Produto</th><th style="padding:10px;">Status</th><th style="padding:10px;">Hora Uso</th></tr></thead><tbody id="tabelaHist"></tbody></table></div>
<script src="/socket.io/socket.io.js"></script><script>
const socket=io();
socket.on('dados_admin',(dados)=>{
    const div=document.getElementById('paineis'); div.innerHTML="";
    dados.campanhas.forEach((c,index)=>{ div.innerHTML+=\`<div style="background:#444; padding:10px; margin-bottom:10px; border-radius:5px; border-left: 5px solid \${c.ativa?'#0f0':'#f00'}"><strong>\${c.nome}</strong><br>Estoque: <input id="qtd_\${index}" type="number" value="\${c.qtd}" style="width:50px;"> <button onclick="salvar(\${index})">💾</button> | Saíram: <b>\${c.totalResgates}</b></div>\` });
    const tbody = document.getElementById('tabelaHist'); tbody.innerHTML = "";
    dados.ultimos.forEach(u => {
        let corStatus = u.status === 'USADO' ? '#d4edda' : '#fff3cd'; let corTexto = u.status === 'USADO' ? 'green' : '#856404'; let horaUso = u.horaBaixa ? u.horaBaixa : '-';
        tbody.innerHTML += \`<tr style="border-bottom:1px solid #555;"><td style="padding:8px; text-align:center;">\${u.hora}</td><td style="padding:8px; text-align:center; font-weight:bold;">\${u.codigo}</td><td style="padding:8px;">\${u.produto}</td><td style="padding:8px; text-align:center;"><span style="background:\${corStatus}; color:\${corTexto}; padding:3px 8px; border-radius:4px; font-size:12px; font-weight:bold;">\${u.status}</span></td><td style="padding:8px; text-align:center;">\${horaUso}</td></tr>\`;
    });
});
function salvar(id){const q=document.getElementById('qtd_'+id).value;socket.emit('admin_update',{id:id,qtd:q});}
</script></body></html>`;

// --- ESTA LINHA É OBRIGATÓRIA AQUI NO FINAL DO TEMPLATES.JS ---
module.exports = { htmlTV, htmlMobile, htmlAdmin, htmlCaixa };
