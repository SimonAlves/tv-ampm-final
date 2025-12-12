// --- ARQUIVOS DE DESIGN (HTML) ---

const htmlTV = `
<!DOCTYPE html><html><head><title>TV AMPM</title></head><body style="margin:0; background:black; overflow:hidden; font-family:Arial; display:flex; flex-direction:column; height:100vh;">
<div style="display:flex; flex:1; width:100%; transition: background 0.5s;">
    <div style="flex:3; background:#333; display:flex; align-items:center; justify-content:center; overflow:hidden;" id="bgEsq">
        <img id="imgDisplay" src="" style="width:100%; height:100%; object-fit:contain; display:none;" onerror="this.style.display='none'; document.getElementById('avisoErro').style.display='block';">
        <div id="avisoErro" style="display:none; color:white; text-align:center;"><h1>⚠️ Carregando...</h1><p>Aguarde um momento.</p></div>
    </div>
    <div style="flex:1; background:#003399; display:flex; flex-direction:column; align-items:center; justify-content:center; border-left:6px solid #FFCC00; text-align:center; color:white;" id="bgDir">
        <img src="logo.png" onerror="this.style.display='none'" style="width:140px; background:white; padding:10px; border-radius:15px; margin-bottom:20px;">
        <h1 id="nomeProd" style="font-size:2.2rem; padding:0 10px; font-weight:800;">...</h1>
        
        <div style="background:white; padding:10px; border-radius:10px; margin-top:10px;">
            <img id="qr" src="/qrcode" style="width:200px; display:block;">
        </div>
        
        <p style="margin-top:15px; font-weight:bold; font-size:1.3rem; color:#FFCC00;" id="txtScan">APONTE A CÂMERA</p>
        <div id="boxNum" style="margin-top:20px; border-top:2px dashed rgba(255,255,255,0.3); width:80%; padding-top:20px;">
            <span style="font-size:1rem;">RESTAM APENAS:</span><br><span id="num" style="font-size:6rem; color:#FFCC00; font-weight:900; line-height:1;">--</span>
        </div>
    </div>
</div>
<div style="height:10vh; background:#111; border-top: 4px solid #F37021; display:flex; align-items:center; justify-content:space-around; color:#888; padding: 0 20px;">
    <span style="font-weight:bold;">PARCEIROS:</span><h2 style="margin:0; color:white; font-style:italic;">Ipiranga</h2><h2 style="margin:0; color:#FFCC00;">Abastece-aí</h2><h2 style="margin:0; color:#F37021;">AMPM</h2>
</div>
<script src="/socket.io/socket.io.js"></script><script>
const socket=io();const imgTag=document.getElementById('imgDisplay');const aviso=document.getElementById('avisoErro');
socket.on('trocar_slide',d=>{actualizarTela(d)});
socket.on('atualizar_qtd',d=>{if(document.getElementById('nomeProd').innerText===d.nome){document.getElementById('num').innerText=d.qtd}});
function actualizarTela(d){
    document.getElementById('nomeProd').innerText=d.nome;document.getElementById('num').innerText=d.qtd;
    const corTexto=(d.corPrincipal==='#FFD700')?'#003399':'white';
    document.getElementById('bgDir').style.background=d.corPrincipal;document.getElementById('bgEsq').style.background=d.corSecundaria;
    document.getElementById('bgDir').style.color=corTexto;document.getElementById('num').style.color=(d.corPrincipal==='#FFD700')?'#003399':'#FFCC00';
    document.getElementById('txtScan').style.color=(d.corPrincipal==='#FFD700')?'#003399':'#FFCC00';
    imgTag.style.display='block';aviso.style.display='none';imgTag.src=d.arquivo;
    if(d.ehSorteio){document.getElementById('boxNum').style.display='none';document.getElementById('txtScan').innerText="TENTE A SORTE!"}
    else{document.getElementById('boxNum').style.display='block';document.getElementById('txtScan').innerText="GARANTA O SEU"}
}
</script></body></html>`;

const htmlMobile = `
<!DOCTYPE html><html><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{font-family:Arial,sans-serif;text-align:center;padding:20px;background:#f0f2f5;margin:0;transition:background 0.3s}.loader{border:5px solid #f3f3f3;border-top:5px solid #F37021;border-radius:50%;width:50px;height:50px;animation:spin 1s linear infinite;margin:20px auto}@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}.ticket-paper{background:#fff;padding:0;margin-top:20px;box-shadow:0 5px 15px rgba(0,0,0,0.1);border-top:10px solid #F37021}.ticket-body{padding:25px}.codigo-texto{font-size:32px;font-weight:bold;letter-spacing:2px;font-family:monospace;color:#333}.no-print{display:block}@media print{.no-print{display:none}body{background:white}.ticket-paper{box-shadow:none;border:1px solid #ccc}}</style><body>
<div id="telaPegar" style="margin-top:50px;"><img src="logo.png" width="150" style="margin-bottom:20px"><h2 style="color:#333;">Processando oferta...</h2><div class="loader"></div><p style="color:#666;">Verificando disponibilidade...</p></div>
<div id="telaVoucher" style="display:none"><h2 id="tituloParabens" class="no-print" style="color:#003399">SUCESSO! 🎉</h2><div class="ticket-paper" id="ticketContainer"><div class="ticket-body"><img src="logo.png" width="100" style="margin-bottom:15px" onerror="this.style.display='none'"><p style="font-size:14px;color:#666">VOUCHER AMPM</p><h1 id="voucherNome" style="font-size:24px;color:#333;margin:5px 0">...</h1><div style="background:#f8f9fa;border:2px dashed #ccc;padding:15px;margin:20px 0"><div class="codigo-texto" id="codGerado">...</div></div><p style="font-size:12px;color:#555">Gerado em: <span id="dataHora" style="font-weight:bold"></span><br>Válido hoje.</p></div></div><button onclick="window.print()" class="btn-pegar no-print" style="background:#333;color:white;padding:15px;width:100%;border:none;border-radius:10px;margin-top:30px;font-size:18px">🖨️ IMPRIMIR</button><p class="no-print" style="font-size:12px;color:gray;margin-top:20px">⚠️ Você já garantiu seu cupom de hoje.</p></div>
<script src="/socket.io/socket.io.js"></script><script>
const socket=io();let jaPediu=false;const hoje=new Date().toLocaleDateString('pt-BR');const salvo=localStorage.getItem('ampm_cupom_v_final');const dataSalva=localStorage.getItem('ampm_data_v_final');
if(salvo&&dataSalva===hoje){mostrarVoucher(JSON.parse(salvo))}
socket.on('trocar_slide',d=>{if(document.getElementById('telaVoucher').style.display==='none'&&!jaPediu){jaPediu=true;setTimeout(()=>{socket.emit('resgatar_oferta',d.id)},1000)}});
socket.emit('pedir_atualizacao');
socket.on('sucesso',dados=>{const agora=new Date();dados.horaTexto=agora.toLocaleDateString('pt-BR')+' '+agora.toLocaleTimeString('pt-BR');localStorage.setItem('ampm_cupom_v_final',JSON.stringify(dados));localStorage.setItem('ampm_data_v_final',agora.toLocaleDateString('pt-BR'));mostrarVoucher(dados)});
function mostrarVoucher(dados){document.getElementById('telaPegar').style.display='none';document.getElementById('telaVoucher').style.display='block';document.getElementById('voucherNome').innerText=dados.produto;document.getElementById('codGerado').innerText=dados.codigo;document.getElementById('dataHora').innerText=dados.horaTexto;document.getElementById('ticketContainer').style.borderTopColor=dados.corPrincipal;if(dados.isGold){document.body.style.backgroundColor="#FFD700";document.getElementById('tituloParabens').innerText="🌟 SORTE GRANDE! 🌟";document.getElementById('voucherNome').innerHTML="🌟 "+dados.produto+" 🌟"}}
</script></body></html>`;

const htmlAdmin = `
<!DOCTYPE html><html><meta name="viewport" content="width=device-width, initial-scale=1"><body style="font-family:Arial; padding:20px; background:#222; color:white;"><h1>🎛️ Painel AMPM</h1><div style="margin-bottom:20px;padding:15px;background:#333;border-radius:10px;border:1px solid #555;"><h3>📊 Relatório de Vendas</h3><a href="/baixar-relatorio" target="_blank"><button style="padding:10px 20px;background:#009933;color:white;border:none;font-weight:bold;cursor:pointer;">📥 BAIXAR EXCEL</button></a></div><div id="paineis"></div><script src="/socket.io/socket.io.js"></script><script>
const socket=io();socket.on('dados_admin',(lista)=>{const div=document.getElementById('paineis');div.innerHTML="";lista.forEach((c,index)=>{let max=0;let hora=0;c.resgatesPorHora.forEach((q,h)=>{if(q>max){max=q;hora=h}});const pico=max>0?hora+":00h ("+max+" un)":"Sem dados";div.innerHTML+=\`<div style="background:#444;padding:15px;margin-bottom:15px;border-radius:10px;border-left:8px solid \${c.ativa?'#0f0':'#f00'}"><h3>\${c.nome}</h3><div style="display:flex;gap:10px;"><label>Estoque:</label><input id="qtd_\${index}" type="number" value="\${c.qtd}" style="width:60px;"><button onclick="salvar(\${index})">Salvar</button></div><br><span>📈 Já: <b>\${c.totalResgates}</b></span><br><small>Pico: \${pico}</small></div>\`})});function salvar(id){const q=document.getElementById('qtd_'+id).value;socket.emit('admin_update',{id:id,qtd:q});alert('Ok!')}
</script></body></html>`;

module.exports = { htmlTV, htmlMobile, htmlAdmin };
