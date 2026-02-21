/**
 * Agenda Consultório - Aplicação
 */
(function () {
  const PAGINAS = { inicio: 'paginaInicio', medicos: 'paginaMedicos', pacientes: 'paginaPacientes', parametros: 'paginaParametros', consultas: 'paginaConsultas' };

  let medicos = [];
  let pacientes = [];
  let tempoConsulta = 30;
  let horaInicioMin = 480;
  let horaFimMin = 1080;
  let consultaData = '';
  let consultaMedico = null;
  let consultasDoDia = [];
  let slotSelecionado = null;
  let consultaEditando = null;

  // Utilitários
  function mostrarToast(msg, tipo = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = 'toast toast-' + tipo + ' toast-visible';
    setTimeout(() => toast.classList.remove('toast-visible'), 2500);
  }

  function escapeHtml(s) {
    if (s == null) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function formatarData(d) {
    if (!d) return '';
    const dt = typeof d === 'string' ? new Date(d) : d;
    return dt.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  }

  function formatarDataCurta(d) {
    if (!d) return '';
    const dt = typeof d === 'string' ? new Date(d) : d;
    return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function escapeAttr(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function formatarHora(minutos) {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  function minutosParaStr(minutos) {
    return `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;
  }

  function maskCpf(v) {
    return v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2').substring(0, 14);
  }

  function maskTelefone(v) {
    return v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').substring(0, 15);
  }

  // Navegação
  function irPara(pagina) {
    Object.keys(PAGINAS).forEach(k => {
      document.getElementById(PAGINAS[k])?.classList.toggle('ativa', k === pagina);
    });
    document.querySelectorAll('.nav-menu a').forEach(a => {
      a.classList.toggle('active', a.dataset.pagina === pagina);
    });
    if (pagina === 'consultas') iniciarFluxoConsulta();
    if (pagina === 'parametros') carregarParametros();
  }

  document.querySelectorAll('[data-pagina]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      irPara(el.dataset.pagina);
    });
  });

  // ========== MÉDICOS ==========
  function toggleFormMedico(mostrar, id = null) {
    const secaoForm = document.getElementById('secaoFormMedico');
    const secaoLista = document.getElementById('secaoListaMedicos');
    secaoForm.classList.toggle('hidden', !mostrar);
    secaoLista.classList.toggle('hidden', mostrar);
    document.getElementById('tituloFormMedico').textContent = id ? 'Editar Médico' : 'Novo Médico';
    if (mostrar && id) carregarMedicoParaEdicao(id);
    else if (mostrar) limparFormMedico();
  }

  function limparFormMedico() {
    document.getElementById('formMedico').reset();
    document.getElementById('medicoId').value = '';
  }

  async function carregarMedicoParaEdicao(id) {
    const m = await getMedicoById(id);
    if (!m) return;
    document.getElementById('medicoId').value = m.id;
    document.getElementById('medicoNome').value = m.nome || '';
    document.getElementById('medicoEspecialidade').value = m.especialidade || '';
    document.getElementById('medicoCrm').value = m.crm || '';
    document.getElementById('medicoTelefone').value = m.telefone ? maskTelefone(m.telefone) : '';
  }

  function filtrarMedicos() {
    const nome = (document.getElementById('filtroMedicoNome')?.value || '').toLowerCase().trim();
    const esp = (document.getElementById('filtroMedicoEspecialidade')?.value || '').toLowerCase().trim();
    const crm = (document.getElementById('filtroMedicoCrm')?.value || '').toLowerCase().trim();
    const tel = (document.getElementById('filtroMedicoTelefone')?.value || '').replace(/\D/g, '');
    return medicos.filter(m => {
      const matchNome = !nome || (m.nome || '').toLowerCase().includes(nome);
      const matchEsp = !esp || (m.especialidade || '').toLowerCase().includes(esp);
      const matchCrm = !crm || (m.crm || '').toLowerCase().includes(crm);
      const matchTel = !tel || (m.telefone || '').replace(/\D/g, '').includes(tel);
      return matchNome && matchEsp && matchCrm && matchTel;
    });
  }

  function renderizarMedicos() {
    const tbody = document.getElementById('tbodyMedicos');
    const lista = filtrarMedicos();
    if (!lista.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty">Nenhum médico cadastrado.</td></tr>';
      return;
    }
    tbody.innerHTML = lista.map(m => `
      <tr class="${m.ativo === false ? 'inativo' : ''}">
        <td>${escapeHtml(m.nome)}</td>
        <td>${escapeHtml(m.especialidade)}</td>
        <td>${escapeHtml(m.crm)}</td>
        <td>${escapeHtml(m.telefone ? maskTelefone(m.telefone) : '-')}</td>
        <td class="acoes">
          ${m.ativo !== false ? `
            <button type="button" class="btn-icon btn-editar" data-id="${m.id}" title="Editar">✏️</button>
            <button type="button" class="btn-icon btn-desativar" data-id="${m.id}" title="Desativar">⏸️</button>
          ` : `
            <button type="button" class="btn-icon btn-ativar" data-id="${m.id}" title="Reativar">▶️</button>
          `}
        </td>
      </tr>
    `).join('');
    tbody.querySelectorAll('.btn-editar').forEach(b => b.addEventListener('click', () => toggleFormMedico(true, parseInt(b.dataset.id, 10))));
    tbody.querySelectorAll('.btn-desativar').forEach(b => b.addEventListener('click', () => desativarMedico(parseInt(b.dataset.id, 10))));
    tbody.querySelectorAll('.btn-ativar').forEach(b => b.addEventListener('click', () => ativarMedico(parseInt(b.dataset.id, 10))));
  }

  async function carregarMedicos() {
    try {
      medicos = await getMedicos();
      renderizarMedicos();
    } catch (e) {
      mostrarToast('Erro ao carregar médicos: ' + e.message, 'error');
    }
  }

  async function salvarMedico(e) {
    e.preventDefault();
    const id = document.getElementById('medicoId').value;
    const dados = {
      nome: document.getElementById('medicoNome').value.trim(),
      especialidade: document.getElementById('medicoEspecialidade').value.trim(),
      crm: document.getElementById('medicoCrm').value.trim(),
      telefone: document.getElementById('medicoTelefone').value.trim().replace(/\D/g, '') || null
    };
    if (!dados.nome || !dados.especialidade || !dados.crm) {
      mostrarToast('Preencha nome, especialidade e CRM.', 'error');
      return;
    }
    try {
      if (id) {
        await updateMedico(id, dados);
        mostrarToast('Médico atualizado!');
      } else {
        await addMedico(dados);
        mostrarToast('Médico cadastrado!');
      }
      toggleFormMedico(false);
      carregarMedicos();
    } catch (erro) {
      mostrarToast('Erro ao salvar: ' + (erro.message || erro), 'error');
    }
  }

  async function desativarMedico(id) {
    if (!confirm('Desativar este médico? Ele não aparecerá na lista de seleção de consultas.')) return;
    try {
      await updateMedico(id, { ativo: false });
      mostrarToast('Médico desativado.');
      carregarMedicos();
    } catch (e) {
      mostrarToast('Erro: ' + e.message, 'error');
    }
  }

  async function ativarMedico(id) {
    try {
      await updateMedico(id, { ativo: true });
      mostrarToast('Médico reativado.');
      carregarMedicos();
    } catch (e) {
      mostrarToast('Erro: ' + e.message, 'error');
    }
  }

  document.getElementById('formMedico').addEventListener('submit', salvarMedico);
  document.getElementById('btnNovoMedico').addEventListener('click', () => toggleFormMedico(true));
  document.getElementById('btnCancelarMedico').addEventListener('click', () => toggleFormMedico(false));

  document.getElementById('medicoTelefone').addEventListener('input', (e) => {
    e.target.value = maskTelefone(e.target.value);
  });

  ['filtroMedicoNome', 'filtroMedicoEspecialidade', 'filtroMedicoCrm', 'filtroMedicoTelefone'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => renderizarMedicos());
  });

  // ========== PACIENTES ==========
  function toggleFormPaciente(mostrar, id = null) {
    const secaoForm = document.getElementById('secaoFormPaciente');
    const secaoLista = document.getElementById('secaoListaPacientes');
    secaoForm.classList.toggle('hidden', !mostrar);
    secaoLista.classList.toggle('hidden', mostrar);
    document.getElementById('tituloFormPaciente').textContent = id ? 'Editar Paciente' : 'Novo Paciente';
    if (mostrar && id) carregarPacienteParaEdicao(id);
    else if (mostrar) limparFormPaciente();
  }

  function limparFormPaciente() {
    document.getElementById('formPaciente').reset();
    document.getElementById('pacienteId').value = '';
  }

  async function carregarPacienteParaEdicao(id) {
    const p = await getPacienteById(id);
    if (!p) return;
    document.getElementById('pacienteId').value = p.id;
    document.getElementById('pacienteNome').value = p.nome || '';
    document.getElementById('pacienteCpf').value = p.cpf ? maskCpf(p.cpf) : '';
    document.getElementById('pacienteTelefone').value = p.telefone ? maskTelefone(p.telefone) : '';
    document.getElementById('pacientePlano').value = p.planoSaude || '';
  }

  function filtrarPacientes() {
    const nome = (document.getElementById('filtroPacienteNome')?.value || '').toLowerCase().trim();
    const cpf = (document.getElementById('filtroPacienteCpf')?.value || '').replace(/\D/g, '');
    const tel = (document.getElementById('filtroPacienteTelefone')?.value || '').replace(/\D/g, '');
    const plano = (document.getElementById('filtroPacientePlano')?.value || '').toLowerCase().trim();
    return pacientes.filter(p => {
      const matchNome = !nome || (p.nome || '').toLowerCase().includes(nome);
      const matchCpf = !cpf || (p.cpf || '').replace(/\D/g, '').includes(cpf);
      const matchTel = !tel || (p.telefone || '').replace(/\D/g, '').includes(tel);
      const matchPlano = !plano || (p.planoSaude || '').toLowerCase().includes(plano);
      return matchNome && matchCpf && matchTel && matchPlano;
    });
  }

  function renderizarPacientes() {
    const tbody = document.getElementById('tbodyPacientes');
    const lista = filtrarPacientes();
    if (!lista.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty">Nenhum paciente cadastrado.</td></tr>';
      return;
    }
    tbody.innerHTML = lista.map(p => `
      <tr>
        <td>${escapeHtml(p.nome)}</td>
        <td>${escapeHtml(p.cpf ? maskCpf(p.cpf) : '-')}</td>
        <td>${escapeHtml(p.telefone ? maskTelefone(p.telefone) : '-')}</td>
        <td>${escapeHtml(p.planoSaude || '-')}</td>
        <td class="acoes">
          <button type="button" class="btn-icon btn-agendamentos" data-id="${p.id}" data-nome="${escapeAttr(p.nome)}" title="Ver agendamentos">📅</button>
          <button type="button" class="btn-icon btn-editar" data-id="${p.id}" title="Editar">✏️</button>
          <button type="button" class="btn-icon btn-excluir" data-id="${p.id}" title="Excluir">🗑️</button>
        </td>
      </tr>
    `).join('');
    tbody.querySelectorAll('.btn-editar').forEach(b => b.addEventListener('click', () => toggleFormPaciente(true, parseInt(b.dataset.id, 10))));
    tbody.querySelectorAll('.btn-excluir').forEach(b => b.addEventListener('click', () => excluirPaciente(parseInt(b.dataset.id, 10))));
    tbody.querySelectorAll('.btn-agendamentos').forEach(b => b.addEventListener('click', () => abrirModalAgendamentosPaciente(parseInt(b.dataset.id, 10), b.dataset.nome)));
  }

  async function carregarPacientes() {
    try {
      pacientes = await getPacientes();
      renderizarPacientes();
    } catch (e) {
      mostrarToast('Erro ao carregar pacientes: ' + e.message, 'error');
    }
  }

  async function salvarPaciente(e) {
    e.preventDefault();
    const id = document.getElementById('pacienteId').value;
    const cpf = document.getElementById('pacienteCpf').value.replace(/\D/g, '');
    const dados = {
      nome: document.getElementById('pacienteNome').value.trim(),
      cpf: cpf || null,
      telefone: document.getElementById('pacienteTelefone').value.trim().replace(/\D/g, '') || null,
      planoSaude: document.getElementById('pacientePlano').value.trim() || null
    };
    if (!dados.nome) {
      mostrarToast('Informe o nome do paciente.', 'error');
      return;
    }
    try {
      if (id) {
        await updatePaciente(id, dados);
        mostrarToast('Paciente atualizado!');
      } else {
        await addPaciente(dados);
        mostrarToast('Paciente cadastrado!');
      }
      toggleFormPaciente(false);
      carregarPacientes();
    } catch (erro) {
      mostrarToast('Erro ao salvar: ' + (erro.message || erro), 'error');
    }
  }

  async function excluirPaciente(id) {
    if (!confirm('Excluir este paciente? Esta ação não pode ser desfeita.')) return;
    try {
      await deletePaciente(id);
      mostrarToast('Paciente excluído.');
      carregarPacientes();
    } catch (e) {
      mostrarToast('Erro: ' + e.message, 'error');
    }
  }

  document.getElementById('formPaciente').addEventListener('submit', salvarPaciente);
  document.getElementById('btnNovoPaciente').addEventListener('click', () => toggleFormPaciente(true));
  document.getElementById('btnCancelarPaciente').addEventListener('click', () => toggleFormPaciente(false));

  document.getElementById('pacienteCpf').addEventListener('input', (e) => {
    e.target.value = maskCpf(e.target.value);
  });
  document.getElementById('pacienteTelefone').addEventListener('input', (e) => {
    e.target.value = maskTelefone(e.target.value);
  });

  ['filtroPacienteNome', 'filtroPacienteCpf', 'filtroPacienteTelefone', 'filtroPacientePlano'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => renderizarPacientes());
  });

  function irParaAgendaDoMedico(consulta) {
    const dataStr = (consulta.data && String(consulta.data).length >= 10) ? String(consulta.data).substring(0, 10) : '';
    const idMedico = consulta.idMedico;
    if (!dataStr || !idMedico) return;
    document.getElementById('modalAgendamentosPaciente')?.classList.remove('open');
    irPara('consultas');
    consultaData = dataStr;
    consultaMedico = medicos.find(m => Number(m.id) === Number(idMedico));
    document.getElementById('inputDataConsulta').value = dataStr;
    document.getElementById('dataSelecionada').textContent = formatarData(new Date(dataStr + 'T12:00:00'));
    document.getElementById('stepData').classList.add('hidden');
    document.getElementById('stepMedico').classList.add('hidden');
    document.getElementById('stepAgenda').classList.remove('hidden');
    document.getElementById('medicoSelecionado').textContent = consultaMedico ? consultaMedico.nome + ' - ' + consultaMedico.especialidade : '';
    document.getElementById('agendaDiaTitulo').textContent = formatarData(new Date(dataStr + 'T12:00:00'));
    carregarAgenda();
  }

  async function abrirModalAgendamentosPaciente(idPaciente, nomePaciente) {
    const modal = document.getElementById('modalAgendamentosPaciente');
    const titulo = document.getElementById('modalAgendamentosTitulo');
    const lista = document.getElementById('modalAgendamentosLista');
    titulo.textContent = 'Agendamentos - ' + (nomePaciente || 'Paciente');
    modal.dataset.idPaciente = idPaciente;
    modal.dataset.nomePaciente = nomePaciente || '';
    const todasConsultas = await getConsultas();
    const doPaciente = todasConsultas.filter(c => Number(c.idPaciente) === Number(idPaciente));
    doPaciente.sort((a, b) => {
      if (a.data !== b.data) return b.data.localeCompare(a.data);
      return (parseInt(b.horaInicio, 10) || 0) - (parseInt(a.horaInicio, 10) || 0);
    });
    if (!doPaciente.length) {
      lista.innerHTML = '<div class="select-paciente-item" style="color: var(--text-muted);">Nenhum agendamento encontrado.</div>';
    } else {
      lista.innerHTML = doPaciente.map(c => {
        const med = medicos.find(m => Number(m.id) === Number(c.idMedico));
        const dataStr = c.data ? (c.data.length >= 10 ? c.data.substring(0, 10) : c.data) : '';
        const horaStr = minutosParaStr(parseInt(c.horaInicio, 10) || 0);
        return `<div class="select-paciente-item agendamento-paciente-item">
          <div class="agendamento-paciente-info">
            <div class="nome">${dataStr} às ${horaStr}</div>
            <div class="cpf">${escapeHtml(med ? med.nome + ' - ' + med.especialidade : 'Médico')}</div>
          </div>
          <div class="agendamento-paciente-acoes">
            <button type="button" class="btn-icon btn-agenda" data-consulta-id="${c.id}" title="Ir à agenda">📅</button>
            <button type="button" class="btn-icon btn-editar" data-consulta-id="${c.id}" title="Editar">✏️</button>
            <button type="button" class="btn-icon btn-excluir" data-consulta-id="${c.id}" title="Excluir">🗑️</button>
          </div>
        </div>`;
      }).join('');
      const consultasMap = new Map(doPaciente.map(c => [String(c.id), c]));
      lista.querySelectorAll('.btn-agenda').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const c = consultasMap.get(btn.dataset.consultaId);
          if (c) irParaAgendaDoMedico(c);
        });
      });
      lista.querySelectorAll('.btn-editar').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const c = consultasMap.get(btn.dataset.consultaId);
          if (!c) return;
          consultaMedico = medicos.find(m => Number(m.id) === Number(c.idMedico));
          consultaData = (c.data && String(c.data).length >= 10) ? String(c.data).substring(0, 10) : '';
          modal.classList.remove('open');
          const minutosAtuais = parseInt(c.horaInicio, 10) || 0;
          abrirModalMoverConsulta(c, minutosAtuais);
        });
      });
      lista.querySelectorAll('.btn-excluir').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const id = parseInt(btn.dataset.consultaId, 10);
          if (!confirm('Excluir esta consulta?')) return;
          try {
            await deleteConsulta(id);
            mostrarToast('Consulta excluída.');
            abrirModalAgendamentosPaciente(parseInt(modal.dataset.idPaciente, 10), modal.dataset.nomePaciente);
          } catch (err) {
            mostrarToast('Erro: ' + err.message, 'error');
          }
        });
      });
    }
    modal.classList.add('open');
  }

  document.getElementById('btnFecharAgendamentos')?.addEventListener('click', () => {
    document.getElementById('modalAgendamentosPaciente')?.classList.remove('open');
  });
  document.getElementById('modalAgendamentosPaciente')?.addEventListener('click', (e) => {
    if (e.target.id === 'modalAgendamentosPaciente') e.target.classList.remove('open');
  });

  function horaStrParaMinutos(str) {
    if (!str) return 0;
    const [h, m] = str.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  // ========== PARÂMETROS ==========
  async function carregarParametros() {
    try {
      const t = await getParametro('tempoConsulta');
      tempoConsulta = t != null ? parseInt(t, 10) : 30;
      document.getElementById('paramTempoConsulta').value = String(tempoConsulta);

      const hab = await getParametro('horaAbertura');
      const hfec = await getParametro('horaFechamento');
      const habStr = hab || '08:00';
      const hfecStr = hfec || '18:00';
      document.getElementById('paramHoraAbertura').value = habStr;
      document.getElementById('paramHoraFechamento').value = hfecStr;

      horaInicioMin = horaStrParaMinutos(habStr);
      horaFimMin = horaStrParaMinutos(hfecStr);
    } catch (e) {
      mostrarToast('Erro ao carregar parâmetros.', 'error');
    }
  }

  document.getElementById('btnSalvarParametros').addEventListener('click', async () => {
    tempoConsulta = parseInt(document.getElementById('paramTempoConsulta').value, 10);
    const horaAbertura = document.getElementById('paramHoraAbertura').value || '08:00';
    const horaFechamento = document.getElementById('paramHoraFechamento').value || '18:00';
    if (horaStrParaMinutos(horaFechamento) <= horaStrParaMinutos(horaAbertura)) {
      mostrarToast('Horário de fechamento deve ser após o de abertura.', 'error');
      return;
    }
    try {
      await setParametro('tempoConsulta', tempoConsulta);
      await setParametro('horaAbertura', horaAbertura);
      await setParametro('horaFechamento', horaFechamento);
      horaInicioMin = horaStrParaMinutos(horaAbertura);
      horaFimMin = horaStrParaMinutos(horaFechamento);
      mostrarToast('Parâmetros salvos!');
    } catch (e) {
      mostrarToast('Erro ao salvar: ' + e.message, 'error');
    }
  });

  // ========== CONSULTAS ==========
  function iniciarFluxoConsulta() {
    const hoje = new Date().toISOString().slice(0, 10);
    document.getElementById('inputDataConsulta').value = hoje;
    document.getElementById('stepData').classList.remove('hidden');
    document.getElementById('stepMedico').classList.add('hidden');
    document.getElementById('stepAgenda').classList.add('hidden');
    consultaData = '';
    consultaMedico = null;
    consultaEditando = null;
  }

  document.getElementById('btnContinuarData').addEventListener('click', () => {
    const data = document.getElementById('inputDataConsulta').value;
    if (!data) {
      mostrarToast('Selecione uma data.', 'error');
      return;
    }
    consultaData = data;
    document.getElementById('dataSelecionada').textContent = formatarData(new Date(data + 'T12:00:00'));
    document.getElementById('stepData').classList.add('hidden');
    document.getElementById('stepMedico').classList.remove('hidden');
    renderizarMedicosConsulta();
  });

  function renderizarMedicosConsulta() {
    const grid = document.getElementById('gridMedicos');
    const ativos = medicos.filter(m => m.ativo !== false);
    if (!ativos.length) {
      grid.innerHTML = '<p style="color: var(--text-muted); padding: 1rem;">Nenhum médico ativo. Cadastre médicos na aba Médicos.</p>';
      return;
    }
    grid.innerHTML = ativos.map(m => `
      <div class="medico-card ${consultaMedico?.id === m.id ? 'selecionado' : ''}" data-id="${m.id}">
        <div class="nome">${escapeHtml(m.nome)}</div>
        <div class="especialidade">${escapeHtml(m.especialidade)}</div>
        <div class="crm">CRM: ${escapeHtml(m.crm)}</div>
        <div class="telefone">${escapeHtml(m.telefone ? maskTelefone(m.telefone) : '-')}</div>
      </div>
    `).join('');
    grid.querySelectorAll('.medico-card').forEach(card => {
      card.addEventListener('click', () => {
        consultaMedico = medicos.find(m => m.id === parseInt(card.dataset.id, 10));
        grid.querySelectorAll('.medico-card').forEach(c => c.classList.remove('selecionado'));
        card.classList.add('selecionado');
        document.getElementById('stepMedico').classList.add('hidden');
        document.getElementById('stepAgenda').classList.remove('hidden');
        document.getElementById('medicoSelecionado').textContent = consultaMedico.nome + ' - ' + consultaMedico.especialidade;
        document.getElementById('agendaDiaTitulo').textContent = formatarData(new Date(consultaData + 'T12:00:00'));
        carregarAgenda();
      });
    });
  }

  document.getElementById('btnVoltarMedico').addEventListener('click', () => {
    document.getElementById('stepMedico').classList.add('hidden');
    document.getElementById('stepData').classList.remove('hidden');
  });

  document.getElementById('btnVoltarAgenda').addEventListener('click', () => {
    document.getElementById('stepAgenda').classList.add('hidden');
    document.getElementById('stepMedico').classList.remove('hidden');
    consultaMedico = null;
  });

  function alterarDiaAgenda(delta) {
    if (!consultaData) return;
    const d = new Date(consultaData + 'T12:00:00');
    d.setDate(d.getDate() + delta);
    consultaData = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    document.getElementById('agendaDiaTitulo').textContent = formatarData(d);
    carregarAgenda();
  }

  document.getElementById('btnDiaAnterior')?.addEventListener('click', () => alterarDiaAgenda(-1));
  document.getElementById('btnDiaProximo')?.addEventListener('click', () => alterarDiaAgenda(1));

  async function carregarAgenda() {
    if (!consultaMedico || !consultaData) return;
    consultasDoDia = await getConsultasPorMedicoEData(consultaMedico.id, consultaData);
    const totalMin = horaFimMin - horaInicioMin;
    const numSlots = Math.floor(totalMin / tempoConsulta);

    const listaEl = document.getElementById('agendaLista');
    listaEl.innerHTML = '';

    for (let i = 0; i < numSlots; i++) {
      const minutosInicio = horaInicioMin + i * tempoConsulta;
      const horaStr = minutosParaStr(minutosInicio);
      const consulta = consultasDoDia.find(c => {
        const cMin = parseInt(String(c.horaInicio).replace(/\D/g, ''), 10);
        return !isNaN(cMin) && cMin === minutosInicio;
      });

      const row = document.createElement('div');
      row.className = 'agenda-row';
      row.dataset.minutos = minutosInicio;

      if (consulta) {
        row.classList.add('ocupado');
        const pac = pacientes.find(p => Number(p.id) === Number(consulta.idPaciente));
        const nomePaciente = pac ? pac.nome : 'Paciente #' + consulta.idPaciente;
        row.innerHTML = `
          <div class="hora-cell">${horaStr}</div>
          <div class="status-cell status-cell-draggable" draggable="true" title="Arraste para outro horário">${escapeHtml(nomePaciente)} ⇄</div>
          <div class="acoes-cell">
            <button type="button" class="btn-slot btn-slot-mover">Mover</button>
            <button type="button" class="btn-slot btn-slot-excluir">Excluir</button>
          </div>
        `;
        const statusCell = row.querySelector('.status-cell');
        statusCell.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('consultaId', consulta.id);
          e.dataTransfer.setData('minutosOrigem', minutosInicio);
          e.dataTransfer.effectAllowed = 'move';
          row.classList.add('dragging-row');
        });
        statusCell.addEventListener('dragend', () => row.classList.remove('dragging-row'));
        row.querySelector('.btn-slot-excluir').addEventListener('click', (e) => {
          e.stopPropagation();
          excluirConsultaSlot(consulta.id);
        });
        row.querySelector('.btn-slot-mover').addEventListener('click', (e) => {
          e.stopPropagation();
          abrirModalMoverConsulta(consulta, minutosInicio);
        });
      } else {
        row.classList.add('disponivel');
        row.innerHTML = `
          <div class="hora-cell">${horaStr}</div>
          <div class="status-cell">Disponível</div>
          <div class="acoes-cell">
            <button type="button" class="btn-slot btn-slot-add">Agendar</button>
          </div>
        `;
        row.addEventListener('dragover', (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          row.classList.add('drag-over');
        });
        row.addEventListener('dragleave', () => row.classList.remove('drag-over'));
        row.addEventListener('drop', (e) => {
          e.preventDefault();
          row.classList.remove('drag-over');
          const consultaId = e.dataTransfer.getData('consultaId');
          const minutosOrigem = parseInt(e.dataTransfer.getData('minutosOrigem'), 10);
          if (consultaId && minutosOrigem !== minutosInicio) {
            moverConsultaPorDrag(parseInt(consultaId, 10), minutosInicio);
          }
        });
        row.addEventListener('click', (e) => {
          if (e.target.classList.contains('btn-slot-add') || e.target.closest('.btn-slot-add')) return;
          if (!e.target.closest('.btn-slot')) abrirModalConsultaNova(minutosInicio);
        });
        row.querySelector('.btn-slot-add').addEventListener('click', (e) => {
          e.stopPropagation();
          abrirModalConsultaNova(minutosInicio);
        });
      }
      listaEl.appendChild(row);
    }
  }

  function abrirModalConsultaNova(minutos) {
    slotSelecionado = minutos;
    consultaEditando = null;
    pacienteSelecionadoId = null;
    document.getElementById('modalConsultaTitulo').textContent = 'Nova Consulta';
    document.getElementById('modalConsultaHorario').textContent = 'Horário: ' + minutosParaStr(minutos);
    document.getElementById('modalBuscaPaciente').value = '';
    document.getElementById('btnExcluirConsulta').style.display = 'none';
    document.getElementById('modalConsulta').classList.add('open');
    listarPacientesModal('');
  }

  async function moverConsultaPorDrag(consultaId, minutosDestino) {
    const ocupados = consultasDoDia.map(c => Number(c.horaInicio));
    if (ocupados.includes(minutosDestino)) {
      mostrarToast('Este horário já está ocupado.', 'error');
      return;
    }
    try {
      await updateConsulta(consultaId, { horaInicio: String(minutosDestino) });
      mostrarToast('Consulta movida!');
      carregarAgenda();
    } catch (e) {
      mostrarToast('Erro: ' + e.message, 'error');
    }
  }

  async function excluirConsultaSlot(id) {
    if (!confirm('Excluir esta consulta?')) return;
    try {
      await deleteConsulta(id);
      mostrarToast('Consulta excluída.');
      carregarAgenda();
    } catch (e) {
      mostrarToast('Erro: ' + e.message, 'error');
    }
  }

  function abrirModalMoverConsulta(consulta, minutosAtuais) {
    const modal = document.getElementById('modalMoverConsulta');
    const info = document.getElementById('modalMoverInfo');
    const inputData = document.getElementById('modalMoverNovaData');
    const select = document.getElementById('modalMoverNovoHorario');
    const pac = pacientes.find(p => Number(p.id) === Number(consulta.idPaciente));
    info.textContent = (pac ? pac.nome : 'Paciente') + ' - Horário atual: ' + minutosParaStr(minutosAtuais);
    const dataOriginal = (consulta.data && String(consulta.data).length >= 10) ? String(consulta.data).substring(0, 10) : consultaData;
    inputData.value = dataOriginal;
    modal.dataset.consultaId = consulta.id;
    modal.dataset.idMedico = consulta.idMedico;
    modal.dataset.minutosAtuais = minutosAtuais;

    async function popularHorarios() {
      const data = inputData.value || dataOriginal;
      const ocupadas = await getConsultasPorMedicoEData(consulta.idMedico, data);
      const ocupadosMin = ocupadas.filter(c => Number(c.id) !== Number(consulta.id)).map(c => Number(c.horaInicio));
      const totalMin = horaFimMin - horaInicioMin;
      const numSlots = Math.floor(totalMin / tempoConsulta);
      const opcoes = [];
      for (let i = 0; i < numSlots; i++) {
        const min = horaInicioMin + i * tempoConsulta;
        const isMesmaData = (data || '').substring(0, 10) === (consulta.data || '').substring(0, 10);
        if (isMesmaData && min === minutosAtuais) continue;
        if (!ocupadosMin.includes(min)) opcoes.push({ value: min, label: minutosParaStr(min) });
      }
      select.innerHTML = opcoes.map(o => `<option value="${o.value}">${o.label}</option>`).join('');
      if (!opcoes.length) select.innerHTML = '<option value="">Nenhum horário vago</option>';
    }
    inputData.onchange = popularHorarios;
    popularHorarios();
    modal.classList.add('open');
  }

  document.getElementById('btnConfirmarMover')?.addEventListener('click', async () => {
    const modal = document.getElementById('modalMoverConsulta');
    const inputData = document.getElementById('modalMoverNovaData');
    const select = document.getElementById('modalMoverNovoHorario');
    const novoMin = parseInt(select.value, 10);
    const novaData = (inputData.value || '').substring(0, 10);
    const id = modal.dataset.consultaId;
    if (!id || !novoMin || isNaN(novoMin)) {
      mostrarToast('Selecione um horário.', 'error');
      return;
    }
    if (!novaData) {
      mostrarToast('Selecione uma data.', 'error');
      return;
    }
    try {
      const updates = { horaInicio: String(novoMin) };
      if (novaData) updates.data = novaData;
      await updateConsulta(Number(id), updates);
      mostrarToast('Consulta movida!');
      modal.classList.remove('open');
      carregarAgenda();
    } catch (e) {
      mostrarToast('Erro: ' + e.message, 'error');
    }
  });

  document.getElementById('btnFecharMover')?.addEventListener('click', () => {
    document.getElementById('modalMoverConsulta')?.classList.remove('open');
  });
  document.getElementById('modalMoverConsulta')?.addEventListener('click', (e) => {
    if (e.target.id === 'modalMoverConsulta') e.target.classList.remove('open');
  });

  function abrirModalConsultaEditar(consulta) {
    consultaEditando = consulta;
    slotSelecionado = parseInt(consulta.horaInicio, 10);
    pacienteSelecionadoId = consulta.idPaciente;
    document.getElementById('modalConsultaTitulo').textContent = 'Editar Consulta';
    document.getElementById('modalConsultaHorario').textContent = 'Horário: ' + minutosParaStr(parseInt(consulta.horaInicio, 10));
    const pac = pacientes.find(p => p.id === consulta.idPaciente);
    document.getElementById('modalBuscaPaciente').value = pac ? pac.nome : '';
    document.getElementById('btnExcluirConsulta').style.display = 'block';
    document.getElementById('modalConsulta').classList.add('open');
    listarPacientesModal(pac ? pac.nome : '');
  }

  let pacienteSelecionadoId = null;

  function listarPacientesModal(busca) {
    const lista = document.getElementById('modalListaPacientes');
    const txt = (busca || document.getElementById('modalBuscaPaciente').value || '').trim();
    const txtLower = txt.toLowerCase();
    const txtCpf = txt.replace(/\D/g, '');
    const filtrados = pacientes.filter(p => {
      if (!txt) return true;
      const matchNome = (p.nome || '').toLowerCase().includes(txtLower);
      const matchCpf = txtCpf && (p.cpf || '').replace(/\D/g, '').includes(txtCpf);
      return matchNome || matchCpf;
    });
    if (!filtrados.length) {
      lista.innerHTML = '<div class="select-paciente-item" style="color: var(--text-muted); cursor: default;">Nenhum paciente encontrado. Cadastre na aba Pacientes.</div>';
      lista.dataset.selecionadoId = '';
      return;
    }
    lista.innerHTML = filtrados.map(p => `
      <div class="select-paciente-item ${pacienteSelecionadoId === p.id ? 'selecionado' : ''}" data-id="${p.id}">
        <div class="nome">${escapeHtml(p.nome)}</div>
        <div class="cpf">${p.cpf ? maskCpf(p.cpf) : ''}</div>
      </div>
    `).join('');
    lista.querySelectorAll('.select-paciente-item[data-id]').forEach(item => {
      item.addEventListener('click', () => {
        pacienteSelecionadoId = parseInt(item.dataset.id, 10);
        lista.querySelectorAll('.select-paciente-item').forEach(i => i.classList.remove('selecionado'));
        item.classList.add('selecionado');
        document.getElementById('modalBuscaPaciente').value = item.querySelector('.nome').textContent;
        lista.dataset.selecionadoId = pacienteSelecionadoId;
      });
    });
  }

  document.getElementById('modalBuscaPaciente').addEventListener('input', () => {
    listarPacientesModal();
  });

  document.getElementById('btnSalvarConsulta').addEventListener('click', async () => {
    let idPac = pacienteSelecionadoId ?? document.getElementById('modalListaPacientes').dataset.selecionadoId;
    if (idPac) idPac = parseInt(idPac, 10);
    const idPaciente = idPac;
    if (!idPaciente) {
      mostrarToast('Selecione um paciente na lista.', 'error');
      return;
    }
    try {
      if (consultaEditando) {
        await updateConsulta(consultaEditando.id, { idPaciente: parseInt(idPaciente, 10) });
        mostrarToast('Consulta atualizada!');
      } else {
        const dataNorm = consultaData.length >= 10 ? consultaData.substring(0, 10) : consultaData;
        await addConsulta({
          idMedico: consultaMedico.id,
          idPaciente: parseInt(idPaciente, 10),
          data: dataNorm,
          horaInicio: String(slotSelecionado)
        });
        mostrarToast('Consulta agendada!');
      }
      document.getElementById('modalConsulta').classList.remove('open');
      carregarAgenda();
    } catch (e) {
      mostrarToast('Erro: ' + e.message, 'error');
    }
  });

  document.getElementById('btnExcluirConsulta').addEventListener('click', async () => {
    if (!consultaEditando || !confirm('Excluir esta consulta?')) return;
    try {
      await deleteConsulta(consultaEditando.id);
      mostrarToast('Consulta excluída.');
      document.getElementById('modalConsulta').classList.remove('open');
      carregarAgenda();
    } catch (e) {
      mostrarToast('Erro: ' + e.message, 'error');
    }
  });

  document.getElementById('btnFecharModalConsulta').addEventListener('click', () => {
    document.getElementById('modalConsulta').classList.remove('open');
  });

  document.getElementById('modalConsulta').addEventListener('click', (e) => {
    if (e.target.id === 'modalConsulta') e.target.classList.remove('open');
  });

  // Demo banner
  function initDemoBanner() {
    const banner = document.getElementById('demoBanner');
    const btnFechar = document.getElementById('btnFecharDemo');
    if (!banner) return;
    const escondido = sessionStorage.getItem('agendaConsultorioDemoFechado');
    if (escondido) banner.classList.add('hidden');
    btnFechar?.addEventListener('click', () => {
      banner.classList.add('hidden');
      sessionStorage.setItem('agendaConsultorioDemoFechado', '1');
    });
  }

  // Inicialização
  initDemoBanner();
  (async function init() {
    await carregarMedicos();
    await carregarPacientes();
    await carregarParametros();
  })();
})();
