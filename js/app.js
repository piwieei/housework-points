/**
 * 家庭赚¥指南 - 主应用逻辑 v4.0
 * 移动端单栏布局 + 底部TabBar + 心愿功能
 */

const App = {
  state: {
    currentView: 'home',
    selectedMemberId: null,
    selectedTask: null,
    selectedReward: null,
    selectedWish: null,
    selectedMember: null,
    taskType: 'earn',
    editingType: null,
    editingId: null,
    selectedEmoji: null,
    selectedColor: null,
  },

  memberEmojis: ['👤', '👨', '👩', '🧒', '👶', '👴', '👵', '🧑', '👦', '👧', '🧔', '👨‍🦰', '👩‍🦰', '🧑‍🦱', '👩‍🦱'],
  taskEmojis: ['🧹', '🍽️', '🚿', '👕', '🍳', '🛏️', '🗑️', '🪟', '🌿', '🐶', '📦', '🧽', '🪣', '🧺', '🔧', '🚗', '📚', '🧑‍🍳', '💧', '🪞'],
  penaltyEmojis: ['🤐', '🚽', '✏️', '😤', '🧸', '⏰', '🙀', '📢', '😡', '👊', '💢', '📱', '🖥️', '🎮', '🍬', '💤'],
  rewardEmojis: ['🎁', '🎬', '🎮', '🍦', '💰', '📱', '🎯', '🍕', '🎠', '🛍️', '🎪', '⭐', '🏆', '🍫', '🎈', '🎟️', '📺', '🧸'],
  wishEmojis: ['🌟', '🧱', '🎡', '📚', '🚲', '🎮', '🧸', '🏖️', '✈️', '🎨', '🎸', '⚽', '🏊', '🎢', '🎂', '🎁', '📱', '💻'],
  memberColors: ['#FF8B94', '#6CC3D5', '#F7DC6F', '#82E0AA', '#BB8FCE', '#F1948A', '#85C1E9', '#F8C471'],

  init() {
    if (Store.isEmpty()) Store.initSampleData();
    this.bindEvents();
    this.renderAll();
  },

  renderAll() {
    const members = Store.getMembers();
    if (members.length > 0 && !this.state.selectedMemberId) {
      this.state.selectedMemberId = members[0].id;
    }
    this.renderMemberBar();
    this.renderCurrentView();
  },

  // ==================== 事件绑定 ====================

  bindEvents() {
    // 底部TabBar
    document.querySelectorAll('.tabbar-item').forEach(btn => {
      btn.addEventListener('click', () => this.switchView(btn.dataset.view));
    });

    // 下拉菜单
    document.getElementById('menuBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('dropdownMenu').classList.toggle('show');
    });
    document.addEventListener('click', () => {
      document.getElementById('dropdownMenu').classList.remove('show');
    });
    document.getElementById('exportBtn').addEventListener('click', () => this.exportData());
    document.getElementById('importBtn').addEventListener('click', () => this.triggerImport());
    document.getElementById('loadSampleBtn').addEventListener('click', () => this.loadSampleData());
    document.getElementById('clearBtn').addEventListener('click', () => this.confirmClearAll());
    document.getElementById('importFile').addEventListener('change', (e) => this.handleImport(e));

    // 添加按钮
    document.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const a = btn.dataset.action;
        if (a === 'add-member') this.openMemberModal();
        if (a === 'add-task') this.openTaskModal(null, 'earn');
        if (a === 'add-reward') this.openRewardModal();
        if (a === 'add-wish') this.openWishModal();
        if (a === 'add-basic-task') this.openBasicTaskModal();
      });
    });

    // 子Tab
    document.querySelectorAll('.sub-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.subtab;
        document.querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.sub-page').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('subpage-' + target).classList.add('active');
        if (target === 'ranking') this.renderRanking();
        if (target === 'income') this.renderIncome();
      });
    });

    // 弹窗
    document.getElementById('modalClose').addEventListener('click', () => this.closeModal());
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
      if (e.target.id === 'modalOverlay') this.closeModal();
    });
    document.getElementById('confirmCancel').addEventListener('click', () => this.closeConfirm());
    document.getElementById('confirmOverlay').addEventListener('click', (e) => {
      if (e.target.id === 'confirmOverlay') this.closeConfirm();
    });

    // 筛选
    document.getElementById('filterMember').addEventListener('change', () => this.renderRecords());
    document.getElementById('filterType').addEventListener('change', () => this.renderRecords());
    document.getElementById('filterTask').addEventListener('change', () => this.renderRecords());

    // 首页快速自定义任务
    document.getElementById('homeQuickEarnBtn').addEventListener('click', () => this.quickAddTask('earn', 'home'));
    document.getElementById('homeQuickPenaltyBtn').addEventListener('click', () => this.quickAddTask('penalty', 'home'));

    // 我的页快速自定义任务
    document.getElementById('quickAddEarnBtn').addEventListener('click', () => this.quickAddTask('earn', 'profile'));
    document.getElementById('quickAddPenaltyBtn').addEventListener('click', () => this.quickAddTask('penalty', 'profile'));

    // 基础零花钱折叠/展开
    document.getElementById('basicSectionHeader').addEventListener('click', () => this.toggleBasicSection());

    // 编辑基础零花钱
    document.getElementById('editWeeklyBase').addEventListener('click', () => this.openWeeklyBaseModal());
  },

  // ==================== 视图切换 ====================

  switchView(viewName) {
    this.state.currentView = viewName;
    document.querySelectorAll('.tabbar-item').forEach(b => b.classList.remove('active'));
    document.querySelector(`.tabbar-item[data-view="${viewName}"]`).classList.add('active');
    this.renderCurrentView();
    document.querySelector('.main-content').scrollTop = 0;
  },

  renderCurrentView() {
    const v = this.state.currentView;
    document.querySelectorAll('.content-view').forEach(el => el.classList.remove('active'));
    document.getElementById('view-' + v).classList.add('active');

    if (v === 'home') this.renderHome();
    if (v === 'records') this.renderRecords();
    if (v === 'ranking') {
      this.renderRanking();
      // 检查当前激活的子标签页，同步渲染
      const activeSub = document.querySelector('#view-ranking .sub-tab.active');
      if (activeSub && activeSub.dataset.subtab === 'income') this.renderIncome();
    }
    if (v === 'rewards') this.renderRewardsView();
    if (v === 'profile') this.renderProfile();
  },

  // ==================== 成员横向选择栏 ====================

  renderMemberBar() {
    const members = Store.getMembers();
    const container = document.getElementById('memberBarScroll');

    let html = members.map(m => {
      const balance = Store.getMemberBalance(m.id);
      const active = m.id === this.state.selectedMemberId;
      return `
        <div class="member-chip ${active ? 'active' : ''}" data-member-id="${m.id}">
          <div class="member-chip-avatar" style="background:${m.color}22;color:${m.color}">${m.avatar}</div>
          <div class="member-chip-name">${this.escape(m.name)}</div>
          <div class="member-chip-balance" style="color:${balance >= 0 ? 'var(--earn)' : 'var(--penalty)'}">¥${balance.toFixed(1)}</div>
        </div>`;
    }).join('');

    html += `<div class="member-chip-add" data-action="add-member">＋</div>`;
    container.innerHTML = html;

    container.querySelectorAll('.member-chip').forEach(el => {
      el.addEventListener('click', () => this.selectMember(el.dataset.memberId));
    });
    container.querySelector('.member-chip-add').addEventListener('click', () => this.openMemberModal());
  },

  selectMember(memberId) {
    this.state.selectedMemberId = memberId;
    this.renderMemberBar();
    if (this.state.currentView === 'home') this.renderHome();
    if (this.state.currentView === 'records') this.renderRecords();
    if (this.state.currentView === 'rewards') this.renderRewardsView();
  },

  // ==================== 首页 ====================

  renderHome() {
    this.renderGreeting();
    this.renderStreakBar();
    this.renderOverview();
    this.renderHomeWishProgress();
    this.renderHomeBasicTasks();
    this.renderHomeTasks();
    this.renderHomeTodayFeed();
    // 预览按钮绑定放在这里，确保不受 renderHomeBasicTasks early-return 影响
    const previewBtn = document.getElementById('btnPreviewClaim');
    if (previewBtn) previewBtn.onclick = () => this.previewClaimAnimation();
  },

  renderGreeting() {
    const hour = new Date().getHours();
    let greeting = '早上好呀！☀️';
    if (hour >= 11 && hour < 13) greeting = '中午好呀！🌤️';
    else if (hour >= 13 && hour < 18) greeting = '下午好呀！🌈';
    else if (hour >= 18) greeting = '晚上好呀！🌙';

    document.getElementById('greetingTitle').textContent = greeting;
    const member = this.state.selectedMemberId ? Store.getMember(this.state.selectedMemberId) : null;
    document.getElementById('greetingSubtitle').textContent = member
      ? `今天也要帮 ${this.escape(member.name)} 赚零花钱呀 ✨`
      : '选择成员开始赚零花钱吧 ✨';

    const now = new Date();
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    document.getElementById('greetingDate').textContent =
      `📅 ${String(now.getMonth()+1).padStart(2,'0')}/${String(now.getDate()).padStart(2,'0')} ${weekDays[now.getDay()]}`;

    const mascots = ['🐰', '🐻', '🐱', '🐶', '🦊', '🐼'];
    document.getElementById('greetingMascot').textContent = mascots[Math.floor(Math.random() * mascots.length)];
  },

  renderStreakBar() {
    const memberId = this.state.selectedMemberId;
    const container = document.getElementById('streakBar');
    if (!memberId) { container.innerHTML = ''; container.style.display = 'none'; return; }

    const streak = Store.getMemberStreak(memberId);
    const { currentStreak, bestStreak, lastActiveDate } = streak;
    const today = Store._todayStr();
    const isActiveToday = lastActiveDate === today;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    const wasActiveYesterday = lastActiveDate === yesterdayStr;
    const isBroken = !isActiveToday && !wasActiveYesterday && lastActiveDate !== null;

    container.style.display = 'block';
    let barClass = 'streak-bar';
    let content = '';

    if (currentStreak === 0 && !lastActiveDate) {
      barClass += ' streak-idle';
      content = `<span class="streak-flame">🔥</span><span class="streak-text">今天还没打卡哦～开始赚零花钱吧！</span>`;
    } else if (isActiveToday) {
      barClass += ' streak-active';
      content = `<span class="streak-flame pulse">🔥</span><span class="streak-text">连续打卡 <b>${currentStreak}</b> 天<span class="streak-best">👑 最佳 ${bestStreak} 天</span></span>`;
    } else if (isBroken) {
      barClass += ' streak-broken';
      content = `<span class="streak-flame broken">😢</span><span class="streak-text">昨日未打卡，重新开始吧<span class="streak-best">👑 最佳 ${bestStreak} 天</span></span>`;
    } else {
      barClass += ' streak-active';
      content = `<span class="streak-flame pulse">🔥</span><span class="streak-text">连续打卡 <b>${currentStreak}</b> 天<span class="streak-best">👑 最佳 ${bestStreak} 天</span></span>`;
    }

    container.className = barClass;
    container.innerHTML = content;
  },

  renderOverview() {
    const memberId = this.state.selectedMemberId;
    const container = document.getElementById('overviewCards');
    if (!memberId) { container.innerHTML = ''; return; }

    const weekStats = Store.getWeekStats(0);
    const memberWeek = weekStats.memberStats.find(m => m.id === memberId);
    const balance = Store.getMemberBalance(memberId);

    const weekEarned = memberWeek ? memberWeek.earned : 0;
    const weekPenalty = memberWeek ? memberWeek.penalty : 0;

    container.innerHTML = `
      <div class="overview-card">
        <div class="overview-card-label">💰 可用余额</div>
        <div class="overview-card-value earn">¥${balance.toFixed(1)}</div>
        <div class="overview-card-sub">累计 ${Store.getMemberEarned(memberId).toFixed(1)} · 罚款 ${Store.getMemberPenalties(memberId).toFixed(1)}</div>
      </div>
      <div class="overview-card">
        <div class="overview-card-label">📅 本周收支</div>
        <div class="overview-card-value earn">+¥${weekEarned.toFixed(1)}</div>
        <div class="overview-card-sub">${weekPenalty > 0 ? `罚款 -¥${weekPenalty.toFixed(1)}` : '暂无罚款 🎉'}</div>
      </div>`;
  },

  renderHomeWishProgress() {
    try {
    const memberId = this.state.selectedMemberId;
    const container = document.getElementById('homeWishProgress');
    if (!container) return;
    if (!memberId) {
      container.innerHTML = `<div class="wish-home-empty">👆 请先选择一位成员查看心愿进度</div>`;
      return;
    }

    const wishes = Store.getWishes();
    if (!wishes || wishes.length === 0) {
      container.innerHTML = `<div class="wish-home-empty">还没有设置心愿，去 <span data-goto-wishes style="color:var(--primary);cursor:pointer;font-weight:700;">🌟 心愿</span> 添加吧</div>`;
      container.querySelector('[data-goto-wishes]')?.addEventListener('click', () => this.switchView('wishes'));
      return;
    }

    const balance = Store.getMemberBalance(memberId);
    const achievements = Store.getWishAchievementsByMember(memberId);
    const achievedIds = new Set((achievements || []).map(a => a.wishId));
    const active = wishes.filter(w => !achievedIds.has(w.id));

    if (active.length === 0) {
      container.innerHTML = `<div class="wish-home-empty">🎉 所有心愿都已达成！太棒了！</div>`;
      return;
    }

    // 按进度排序：最接近达成的排前面，只展示前3个
    const sorted = active
      .map(w => ({ ...w, progress: Math.min(balance / w.targetAmount, 1) }))
      .sort((a, b) => b.progress - a.progress);
    const show = sorted.slice(0, 3);
    const totalWishes = active.length;

    container.innerHTML = `
      <div class="wish-home-header">
        <span class="wish-home-title">🌟 心愿进度</span>
        ${totalWishes > 3 ? `<span class="wish-home-more" data-goto-wishes>共${totalWishes}个 →</span>` : ''}
      </div>
      <div class="wish-home-list">
        ${show.map(w => {
          const pct = Math.round(w.progress * 100);
          const remaining = Math.max(0, w.targetAmount - balance);
          const isFull = w.progress >= 1;
          return `
          <div class="wish-home-item ${isFull ? 'full' : ''}" data-goto-wishes>
            <div class="wish-home-item-left">
              <div class="wish-home-item-icon">${w.icon}</div>
              <div class="wish-home-item-content">
                <div class="wish-home-item-name">${this.escape(w.name)}</div>
                <div class="wish-home-progress-bar-wrap">
                  <div class="wish-home-progress-bar">
                    <div class="wish-home-progress-fill ${isFull ? 'complete' : ''}" style="width:${pct}%"></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="wish-home-item-right">
              ${isFull
                ? `<button class="wish-home-achieve-btn" data-home-achieve="${w.id}">🎉 达成</button>`
                : `<span class="wish-home-balance">¥${remaining.toFixed(1)}</span><span class="wish-home-amount">/${w.targetAmount.toFixed(1)}</span>`
              }
            </div>
          </div>`;
        }).join('')}
      </div>`;

    // 可达成 → 直接达成按钮
    container.querySelectorAll('[data-home-achieve]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.achieveWish(btn.dataset.homeAchieve);
      });
    });
    // 未达成 → 点击跳转心愿页
    container.querySelectorAll('[data-goto-wishes]').forEach(el => {
      el.style.cursor = 'pointer';
      el.addEventListener('click', () => this.switchView('wishes'));
    });
    } catch (e) {
      console.error('renderHomeWishProgress error:', e);
    }
  },

  toggleBasicSection() {
    const list = document.getElementById('homeBasicTasks');
    const arrow = document.getElementById('basicCollapseArrow');
    const isCollapsed = list.classList.toggle('collapsed');
    if (arrow) arrow.classList.toggle('rotated', isCollapsed);
  },

  renderHomeBasicTasks() {
    const memberId = this.state.selectedMemberId;
    const container = document.getElementById('homeBasicTasks');
    const badge = document.getElementById('basicProgress');
    const basicTasks = Store.getBasicTasks();
    const settings = Store.getSettings();

    if (basicTasks.length === 0) {
      container.innerHTML = `<div class="empty-state" style="padding:12px"><div class="empty-state-text">暂无基础任务，去「我的」添加吧</div></div>`;
      badge.textContent = '0/0';
      return;
    }

    let completedCount = 0;
    let allDone = false;
    if (memberId) {
      const progress = Store.getBasicTaskProgress(memberId);
      completedCount = progress.completed;
      allDone = progress.allDone;
    }
    badge.textContent = `${completedCount}/${basicTasks.length}`;

    let html = basicTasks.map(t => {
      const isDone = memberId ? Store.isBasicTaskCompletedThisWeek(t.id, memberId) : false;
      return `
        <div class="basic-task-item ${isDone ? 'done' : ''}" data-basic-task="${t.id}">
          <div class="basic-task-check ${isDone ? 'checked' : ''}">${isDone ? '✅' : '⬜'}</div>
          <span class="basic-task-icon">${t.icon}</span>
          <span class="basic-task-name">${this.escape(t.name)}</span>
        </div>`;
    }).join('');

    // 检查是否已领取本周基础零花钱
    const alreadyClaimed = memberId && allDone && Store.getRecords().some(r =>
      r.memberId === memberId && r.recordType === 'basic' && r.week === Store._weekStr()
    );

    // 全部完成 → 显示领取按钮或已领取提示
    if (memberId && allDone) {
      if (alreadyClaimed) {
        html += `<div class="basic-claim-bar claimed">🎉 本周基础零花钱 ¥${settings.weeklyBaseAmount} 已领取！</div>`;
      } else {
        html += `<button class="btn-claim-basic" id="btnClaimBasic">🎁 全部完成！领取 ¥${settings.weeklyBaseAmount} 基础零花钱</button>`;
      }
    }

    container.innerHTML = html;

    // 已领取 → 自动折叠
    if (alreadyClaimed) {
      container.classList.add('collapsed');
      const arrow = document.getElementById('basicCollapseArrow');
      if (arrow) arrow.classList.add('rotated');
    }

    container.querySelectorAll('.basic-task-item').forEach(item => {
      item.addEventListener('click', () => {
        if (!memberId) { this.toast('请先选择成员', 'error'); return; }
        Store.toggleBasicTaskThisWeek(item.dataset.basicTask, memberId);
        this.renderHomeBasicTasks();
        this.renderMemberBar();
      });
    });

    const claimBtn = document.getElementById('btnClaimBasic');
    if (claimBtn) {
      claimBtn.onclick = () => {
        const result = Store.claimBasicAllowance(memberId);
        if (result.error) { this.toast(result.error, 'error'); return; }
        // claimBasicAllowance 直接返回 record 对象
        const amount = result.amount;
        // 记录按钮位置（飞行动画起点），避免后续 re-render 后失效
        const btnRect = claimBtn.getBoundingClientRect();
        // 直接更新余额 DOM — 最可靠的方式
        const overviewEl = document.getElementById('overviewCards');
        if (overviewEl) {
          const newBalance = Store.getMemberBalance(memberId);
          const weekStats = Store.getWeekStats(0);
          const mw = weekStats.memberStats.find(m => m.id === memberId);
          overviewEl.innerHTML =
            `<div class="overview-card">
              <div class="overview-card-label">💰 可用余额</div>
              <div class="overview-card-value earn">¥${newBalance.toFixed(1)}</div>
              <div class="overview-card-sub">累计 ${Store.getMemberEarned(memberId).toFixed(1)} · 罚款 ${Store.getMemberPenalties(memberId).toFixed(1)}</div>
            </div>
            <div class="overview-card">
              <div class="overview-card-label">📅 本周收支</div>
              <div class="overview-card-value earn">+¥${(mw ? mw.earned : 0).toFixed(1)}</div>
              <div class="overview-card-sub">${(mw && mw.penalty > 0) ? `罚款 -¥${mw.penalty.toFixed(1)}` : '暂无罚款 🎉'}</div>
            </div>`;
          // 余额数字滚动动画：从（新余额 - 本次金额）滚动到新余额
          const balValEl = overviewEl.querySelector('.overview-card-value');
          if (balValEl) this.rollNumber(balValEl, newBalance - amount, newBalance);
        }
        // 金额从按钮飞到余额卡片
        this.flyAmountToCard(amount, btnRect, overviewEl);
        // 居中弹窗 + 撒花 + 顶部提示
        this.showBasicClaimToast(amount);
        this.toast(`¥${amount.toFixed(1)} 基础零花钱已到账！`, 'success');
        this.showConfetti();
        this.renderHomeBasicTasks();
        this.renderHomeWishProgress();
        this.renderHomeTodayFeed();
        this.renderMemberBar();
        this.renderStreakBar();
        this.checkAndNotify(memberId);
      };
    }
  },

  renderHomeTasks() {
    const memberId = this.state.selectedMemberId;
    const allTasks = Store.getTasks();
    const earnTasks = allTasks.filter(t => t.type !== 'penalty');
    const penaltyTasks = allTasks.filter(t => t.type === 'penalty');

    const renderGrid = (tasks, containerId, isPenalty) => {
      const el = document.getElementById(containerId);
      if (tasks.length === 0) {
        el.innerHTML = `<div class="empty-state" style="padding:16px;grid-column:1/-1"><div class="empty-state-text">还没有项目</div></div>`;
        return;
      }
      el.innerHTML = tasks.map(t => `
        <div class="task-card-mobile ${isPenalty ? 'penalty' : ''}" data-task-id="${t.id}">
          <div class="task-card-icon">${t.icon}</div>
          <div class="task-card-name">${this.escape(t.name)}</div>
          <div class="task-card-amount ${isPenalty ? 'penalty' : 'earn'} amount-editable" data-amount-task="${t.id}">${isPenalty ? '-' : '+'}¥${Math.abs(t.amount).toFixed(1)}</div>
        </div>`).join('');

      el.querySelectorAll('.task-card-mobile').forEach(card => {
        card.addEventListener('click', (e) => {
          if (e.target.classList.contains('amount-editable')) {
            e.stopPropagation();
            this.openInlineAmountEdit(e.target.dataset.amountTask, e.target);
            return;
          }
          if (!memberId) { this.toast('请先选择成员', 'error'); return; }
          this.state.selectedTask = card.dataset.taskId;
          this.quickCheckin();
        });
      });
    };

    renderGrid(earnTasks, 'homeEarnTasks', false);
    renderGrid(penaltyTasks, 'homePenaltyTasks', true);
  },

  renderHomeTodayFeed() {
    const memberId = this.state.selectedMemberId;
    const container = document.getElementById('homeTodayFeed');
    if (!memberId) { container.innerHTML = ''; return; }

    const todayRecords = Store.getRecordsByDate(Store._todayStr()).filter(r => r.memberId === memberId);
    if (todayRecords.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🌱</div><div class="empty-state-text">今天还没记录<br>点击任务卡片快速打卡！</div></div>`;
      return;
    }
    const sorted = todayRecords.sort((a, b) => b.timestamp - a.timestamp);
    const member = Store.getMember(memberId);
    container.innerHTML = sorted.map(r => {
      const isEarn = r.amount >= 0;
      const time = new Date(r.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      return `
        <div class="feed-item ${isEarn ? 'earn' : 'penalty'}">
          <div class="feed-avatar" style="background:${member.color}22;color:${member.color}">${member.avatar}</div>
          <div class="feed-content">
            <div class="feed-text"><span class="feed-name">${this.escape(member.name)}</span> ${r.taskIcon} ${this.escape(r.taskName)}</div>
            <div class="feed-time">${time}${r.note ? ' · ' + this.escape(r.note) : ''}</div>
          </div>
          <div class="feed-amount ${isEarn ? 'earn' : 'penalty'}">${isEarn ? '+' : '-'}¥${Math.abs(r.amount).toFixed(1)}</div>
        </div>`;
    }).join('');
  },

  quickCheckin() {
    const memberId = this.state.selectedMemberId;
    const taskId = this.state.selectedTask;
    if (!memberId || !taskId) return;

    const record = Store.addRecord({ memberId, taskId });
    const member = Store.getMember(memberId);
    const isPenalty = record.amount < 0;
    const amountText = isPenalty ? `-¥${Math.abs(record.amount).toFixed(1)}` : `+¥${record.amount.toFixed(1)}`;

    this.toast(`${member ? member.name : ''} ${amountText}`, 'success');
    this.showAmountPopup(amountText);

    this.renderMemberBar();
    this.renderHome();
    this.checkAndNotify(memberId);
  },

  openInlineAmountEdit(taskId, el) {
    const task = Store.getTask(taskId);
    if (!task) return;
    const input = document.createElement('input');
    input.type = 'number'; input.className = 'task-amount-input-inline';
    input.value = Math.abs(task.amount); input.min = '0.1'; input.max = '999'; input.step = '0.1';
    el.replaceWith(input); input.focus(); input.select();

    const save = () => {
      const v = parseFloat(input.value);
      if (isNaN(v) || v <= 0) { this.toast('请输入有效金额', 'error'); input.replaceWith(el); return; }
      Store.updateTask(taskId, { amount: task.type === 'penalty' ? -Math.abs(v) : Math.abs(v) });
      this.toast(`金额已更新 ¥${v.toFixed(1)}`, 'success');
      this.renderHome();
      if (this.state.currentView === 'profile') this.renderProfile();
    };
    input.addEventListener('blur', save);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') input.blur(); if (e.key === 'Escape') input.replaceWith(el); });
  },

  quickAddTask(type, source) {
    const nameId = source === 'home' ? 'homeQuickTaskName' : 'quickTaskName';
    const amountId = source === 'home' ? 'homeQuickTaskAmount' : 'quickTaskAmount';
    const name = document.getElementById(nameId).value.trim();
    const amount = parseFloat(document.getElementById(amountId).value) || 1;
    if (!name) { this.toast('请输入任务名称', 'error'); document.getElementById(nameId).focus(); return; }

    const finalAmount = type === 'penalty' ? -Math.abs(amount) : Math.abs(amount);
    const icons = type === 'penalty' ? this.penaltyEmojis : this.taskEmojis;
    Store.addTask({ name, icon: icons[Math.floor(Math.random() * icons.length)], amount: finalAmount, type });
    this.toast(`"${name}" 已添加`, 'success');
    document.getElementById(nameId).value = '';
    document.getElementById(amountId).value = '1';
    if (source === 'home') this.renderHome();
    else this.renderProfile();
  },

  // ==================== 记录页 ====================

  renderRecords() {
    const members = Store.getMembers();
    const tasks = Store.getTasks();

    // 合并三种数据源
    let items = [];
    Store.getRecords().forEach(r => {
      items.push({ type: r.amount >= 0 ? 'earn' : 'penalty', icon: r.taskIcon, name: r.taskName, amount: r.amount, date: r.date, timestamp: r.timestamp, id: r.id, memberId: r.memberId, taskId: r.taskId, note: r.note, source: 'record' });
    });
    Store.getRedemptions().forEach(r => {
      items.push({ type: 'redeem', icon: r.rewardIcon, name: r.rewardName, amount: -r.amount, date: r.date, timestamp: r.timestamp, id: r.id, memberId: r.memberId, source: 'redeem' });
    });
    Store.getWishAchievements().forEach(a => {
      items.push({ type: 'wish', icon: a.wishIcon, name: '心愿：' + a.wishName, amount: -a.amount, date: a.date, timestamp: a.timestamp, id: a.id, memberId: a.memberId, source: 'wish' });
    });

    const memberSelect = document.getElementById('filterMember');
    const typeSelect = document.getElementById('filterType');
    const taskSelect = document.getElementById('filterTask');
    let cm = memberSelect.value, ct = typeSelect.value, ctk = taskSelect.value;
    // 切换成员时同步下拉筛选
    if (this.state.selectedMemberId) cm = this.state.selectedMemberId;

    memberSelect.innerHTML = '<option value="">全部成员</option>' + members.map(m => `<option value="${m.id}" ${m.id===cm?'selected':''}>${this.escape(m.name)}</option>`).join('');
    typeSelect.value = ct;
    taskSelect.innerHTML = '<option value="">全部任务</option>' + tasks.map(t => `<option value="${t.id}" ${t.id===ctk?'selected':''}>${t.icon} ${this.escape(t.name)}</option>`).join('');

    if (cm) items = items.filter(r => r.memberId === cm);
    if (ct) items = items.filter(r => r.type === ct);
    if (ctk) items = items.filter(r => r.taskId === ctk);
    items.sort((a, b) => b.timestamp - a.timestamp);

    const container = document.getElementById('recordList');
    if (items.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📝</div><div class="empty-state-text">还没有收支记录</div></div>`;
      return;
    }

    const grouped = {};
    items.forEach(r => { if (!grouped[r.date]) grouped[r.date] = []; grouped[r.date].push(r); });
    const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    container.innerHTML = dates.map(date => {
      const day = grouped[date];
      const dEarn = day.filter(r => r.type === 'earn' || (r.amount > 0)).reduce((s, r) => s + Math.abs(r.amount), 0);
      const dSpend = day.filter(r => r.amount < 0).reduce((s, r) => s + Math.abs(r.amount), 0);
      let summary = '';
      if (dEarn > 0 && dSpend > 0) summary = `+¥${dEarn.toFixed(1)} / -¥${dSpend.toFixed(1)}`;
      else if (dEarn > 0) summary = `+¥${dEarn.toFixed(1)}`;
      else if (dSpend > 0) summary = `-¥${dSpend.toFixed(1)}`;

      return `<div style="margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;margin-bottom:5px;padding:0 4px">
          <span style="font-size:11px;font-weight:700;color:var(--text-2)">${this.formatDateLabel(date)}</span>
          <span style="font-size:10px;color:var(--text-3)">${summary}</span>
        </div>
        ${day.map(r => {
          const m = Store.getMember(r.memberId);
          const typeConfig = this._getRecordTypeConfig(r.type);
          return `<div class="record-item record-type-${r.type}">
            <div class="record-avatar" style="background:${(m?m.color:'#999')}22;color:${m?m.color:'#999'}">${m?m.avatar:'👤'}</div>
            <div class="record-content">
              <div class="record-text">
                <span class="record-member-name">${this.escape(m?m.name:'未知')}</span>
                <span class="record-type-badge" style="background:${typeConfig.bg};color:${typeConfig.color}">${typeConfig.label}</span>
                <span class="record-task-name"> · ${r.icon} ${this.escape(r.name)}</span>
              </div>
              ${r.note ? `<div class="record-note">"${this.escape(r.note)}"</div>` : ''}
              <div class="record-date">${new Date(r.timestamp).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}</div>
            </div>
            <div class="record-amount ${r.type}">${typeConfig.sign}¥${Math.abs(r.amount).toFixed(1)}</div>
            <button class="record-delete" data-delete-record="${r.id}" data-delete-source="${r.source}">✕</button>
          </div>`;
        }).join('')}
      </div>`;
    }).join('');

    container.querySelectorAll('[data-delete-record]').forEach(b => b.addEventListener('click', () => this.confirmDeleteRecord(b.dataset.deleteRecord, b.dataset.deleteSource)));
  },

  _getRecordTypeConfig(type) {
    const configs = {
      earn:    { label: '赚钱', color: '#22C55E', bg: '#DCFCE7', sign: '+' },
      penalty: { label: '扣款', color: '#EF4444', bg: '#FEE2E2', sign: '-' },
      redeem:  { label: '兑换', color: '#F59E0B', bg: '#FEF3C7', sign: '-' },
      wish:    { label: '心愿', color: '#A855F7', bg: '#F3E8FF', sign: '-' },
    };
    return configs[type] || configs.earn;
  },

  confirmDeleteRecord(id, source) {
    this.openConfirm('确定删除这条记录？', () => {
      if (source === 'record') Store.deleteRecord(id);
      else if (source === 'redeem') Store.deleteRedemption(id);
      else if (source === 'wish') Store.deleteWishAchievement(id);
      this.toast('已删除', 'success');
      this.renderRecords();
      this.renderMemberBar();
    });
  },

  // ==================== 排行榜 ====================

  renderRanking() {
    const lb = Store.getLeaderboard();
    const container = document.getElementById('rankingList');
    if (lb.length === 0) { container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🏆</div><div class="empty-state-text">还没有成员</div></div>`; return; }
    const medals = ['🥇', '🥈', '🥉'];
    container.innerHTML = lb.map((m, i) => {
      const rank = i + 1;
      return `<div class="ranking-card ${rank<=3?'rank-'+rank:''}">
        <div class="ranking-badge">${rank<=3?medals[i]:rank}</div>
        <div class="ranking-avatar" style="background:${m.color}18;color:${m.color}">${m.avatar}</div>
        <div class="ranking-info"><div class="ranking-name">${this.escape(m.name)}</div><div class="ranking-detail">收入 ¥${m.earned.toFixed(1)}${m.penalties>0?' · 罚款 ¥'+m.penalties.toFixed(1):''} · ${m.taskCount}次</div></div>
        <div class="ranking-score"><div class="ranking-score-value">¥${m.balance.toFixed(1)}</div><div class="ranking-score-label">结余</div></div>
      </div>`;
    }).join('');
  },

  // ==================== 心愿页 ====================

  renderWishes() {
    const memberId = this.state.selectedMemberId;
    const wishes = Store.getWishes();
    const container = document.getElementById('wishList');
    const member = memberId ? Store.getMember(memberId) : null;
    const balance = memberId ? Store.getMemberBalance(memberId) : 0;

    // 过滤已达成心愿
    const achievements = memberId ? Store.getWishAchievementsByMember(memberId) : [];
    const achievedIds = new Set(achievements.map(a => a.wishId));
    const activeWishes = wishes.filter(w => !achievedIds.has(w.id));

    if (activeWishes.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🌟</div><div class="empty-state-text">${wishes.length > 0 ? '所有心愿都已达成 🎉' : '还没有心愿'}</div><button class="btn-add-wish-empty" id="btnAddWishEmpty">＋ 添加新心愿</button></div>`;
    } else {

      container.innerHTML = activeWishes.map(w => {
        const progress = Math.min(balance / w.targetAmount * 100, 100);
        const canAchieve = memberId && balance >= w.targetAmount;
        const coins = this._buildWishCoins(w.targetAmount);

        return `<div class="wish-card ${canAchieve ? 'achievable' : ''}">
          <div class="wish-header">
            <div class="wish-icon">${w.icon}</div>
            <div class="wish-info">
              <div class="wish-name">${this.escape(w.name)}</div>
              ${w.description ? `<div class="wish-desc">${this.escape(w.description)}</div>` : ''}
            </div>
            <div class="wish-actions">
              <button class="icon-btn" data-edit-wish="${w.id}">✏️</button>
              <button class="icon-btn" data-delete-wish="${w.id}">🗑️</button>
            </div>
          </div>
          <div class="wish-progress-section">
            <div class="wish-progress-bar">
              <div class="wish-progress-fill ${progress >= 100 ? 'complete' : ''}" style="width:${progress}%"></div>
            </div>
            <div class="wish-progress-text">
              <span class="wish-progress-current">¥${balance.toFixed(1)}</span>
              <span class="wish-progress-target">目标 ¥${w.targetAmount.toFixed(1)}</span>
            </div>
          </div>
          <div class="wish-footer">
            <div class="wish-coins">${coins}</div>
            ${memberId ? `
              <button class="wish-achieve-btn ${canAchieve ? '' : 'disabled'}" data-achieve-wish="${w.id}" ${canAchieve ? '' : 'disabled'}>
                ${canAchieve ? '🎉 达成心愿' : `还差 ¥${(w.targetAmount - balance).toFixed(1)}`}
              </button>` : '<span style="font-size:11px;color:var(--text-3)">请先选择成员</span>'}
          </div>
        </div>`;
      }).join('');

      container.querySelectorAll('[data-edit-wish]').forEach(b => b.addEventListener('click', (e) => { e.stopPropagation(); this.openWishModal(b.dataset.editWish); }));
      container.querySelectorAll('[data-delete-wish]').forEach(b => b.addEventListener('click', (e) => { e.stopPropagation(); this.confirmDeleteWish(b.dataset.deleteWish); }));
      container.querySelectorAll('[data-achieve-wish]').forEach(b => b.addEventListener('click', () => this.achieveWish(b.dataset.achieveWish)));
    }

    // 空状态下的添加按钮
    const addBtn = document.getElementById('btnAddWishEmpty');
    if (addBtn) addBtn.addEventListener('click', () => this.openWishModal());

    // 已达成心愿
    const achieved = memberId ? Store.getWishAchievementsByMember(memberId) : [];
    const achievedEl = document.getElementById('wishAchievedList');
    if (achieved.length === 0) {
      achievedEl.innerHTML = `<div class="empty-state" style="padding:20px"><div class="empty-state-text">还没有达成的心愿</div></div>`;
    } else {
      achievedEl.innerHTML = achieved.sort((a,b) => b.timestamp - a.timestamp).map(a => `
        <div class="wish-achieved-item">
          <div class="wish-achieved-icon">${a.wishIcon}</div>
          <div class="wish-achieved-info">
            <div class="wish-achieved-name">${this.escape(a.wishName)}</div>
            <div class="wish-achieved-meta">${this.formatDateLabel(a.date)} · ${member ? this.escape(member.name) : ''}</div>
          </div>
          <div class="wish-achieved-amount">-¥${a.amount.toFixed(1)}</div>
        </div>`).join('');
    }
  },

  _buildWishCoins(target) {
    const count = Math.min(Math.ceil(target), 10);
    let coins = '';
    for (let i = 0; i < count; i++) coins += '💰';
    if (target > 10) coins += `...`;
    return coins;
  },

  achieveWish(wishId) {
    const memberId = this.state.selectedMemberId;
    if (!memberId) { this.toast('请先选择成员', 'error'); return; }
    const wish = Store.getWish(wishId);
    if (!wish) return;

    this.openConfirm(`确定用 ¥${wish.targetAmount.toFixed(1)} 达成「${wish.name}」吗？`, () => {
      const result = Store.achieveWish({ memberId, wishId });
      if (!result || result.error) { this.toast(result.error || '兑换失败', 'error'); return; }
      const member = Store.getMember(memberId);
      this.showConfetti();
      this.toast(`🎉 ${member.name} 达成了「${wish.name}」！`, 'success');
      // 刷新所有相关区域（首页进度 + 心愿页 + 成员栏）
      this.renderHomeWishProgress();
      this.renderWishes();
      this.renderMemberBar();
      this.renderCurrentView();
      this.checkAndNotify(memberId);
    });
  },

  openWishModal(wishId = null) {
    this.state.editingType = 'wish'; this.state.editingId = wishId; this.state.selectedEmoji = null;
    const isEdit = !!wishId;
    const wish = isEdit ? Store.getWish(wishId) : null;
    if (isEdit && !wish) return;

    document.getElementById('modalTitle').textContent = isEdit ? '编辑心愿' : '添加心愿';
    const name = wish ? wish.name : '';
    const targetAmount = wish ? wish.targetAmount : 50;
    const desc = wish ? wish.description : '';
    const currentIcon = wish ? wish.icon : '🌟';
    this.state.selectedEmoji = currentIcon;

    document.getElementById('modalBody').innerHTML = `
      <div class="form-group"><label class="form-label">心愿名称</label>
        <input type="text" class="form-input" id="wishNameInput" placeholder="如：买乐高、去游乐园" value="${this.escape(name)}" maxlength="20"></div>
      <div class="form-group"><label class="form-label">目标金额（元）</label>
        <input type="number" class="form-input" id="wishAmountInput" value="${targetAmount}" min="0.1" max="99999" step="0.1"></div>
      <div class="form-group"><label class="form-label">描述（可选）</label>
        <textarea class="form-textarea" id="wishDescInput" maxlength="50">${this.escape(desc)}</textarea></div>
      <div class="form-group"><label class="form-label">选择图标</label>
        <div class="emoji-picker" id="emojiPicker">${this.wishEmojis.map(e => `<div class="emoji-option ${e===currentIcon?'selected':''}" data-emoji="${e}">${e}</div>`).join('')}</div></div>
      <div class="form-actions"><button class="btn btn-cancel" id="formCancelBtn">取消</button><button class="btn btn-primary" id="formSaveBtn">${isEdit?'保存':'添加'}</button></div>
    `;

    document.querySelectorAll('#emojiPicker .emoji-option').forEach(el => {
      el.addEventListener('click', () => {
        document.querySelectorAll('#emojiPicker .emoji-option').forEach(e => e.classList.remove('selected'));
        el.classList.add('selected'); this.state.selectedEmoji = el.dataset.emoji;
      });
    });
    document.getElementById('formCancelBtn').addEventListener('click', () => this.closeModal());
    document.getElementById('formSaveBtn').addEventListener('click', () => this.saveWish());
    this.openModal();
  },

  saveWish() {
    const name = document.getElementById('wishNameInput').value.trim();
    const targetAmount = parseFloat(document.getElementById('wishAmountInput').value) || 1;
    const desc = document.getElementById('wishDescInput').value.trim();
    if (!name) { this.toast('请输入心愿名称', 'error'); return; }

    const data = { name, icon: this.state.selectedEmoji || '🌟', targetAmount, description: desc };
    if (this.state.editingId) { Store.updateWish(this.state.editingId, data); this.toast('心愿已更新', 'success'); }
    else { Store.addWish(data); this.toast('心愿已添加', 'success'); }
    this.closeModal();
    this.renderRewardsView();
  },

  confirmDeleteWish(id) {
    const w = Store.getWish(id);
    if (!w) return;
    this.openConfirm(`确定删除「${w.name}」？`, () => { Store.deleteWish(id); this.toast('已删除', 'success'); this.renderRewardsView(); });
  },

  // ==================== 我的页 ====================

  renderProfile() {
    // 成员管理
    const members = Store.getMembers();
    const memberEl = document.getElementById('profileMemberList');
    memberEl.innerHTML = members.length === 0
      ? `<div class="empty-state" style="padding:16px"><div class="empty-state-text">还没有成员</div></div>`
      : members.map(m => {
          const balance = Store.getMemberBalance(m.id);
          return `<div class="profile-item">
            <div class="profile-item-icon" style="background:${m.color}22;color:${m.color}">${m.avatar}</div>
            <div class="profile-item-info">
              <div class="profile-item-name">${this.escape(m.name)}</div>
              <div class="profile-item-meta">余额 ¥${balance.toFixed(1)}</div>
            </div>
            <div class="profile-item-actions">
              <button class="icon-btn" data-edit-member="${m.id}">✏️</button>
              <button class="icon-btn" data-delete-member="${m.id}">🗑️</button>
            </div>
          </div>`;
        }).join('');

    memberEl.querySelectorAll('[data-edit-member]').forEach(b => b.addEventListener('click', () => this.openMemberModal(b.dataset.editMember)));
    memberEl.querySelectorAll('[data-delete-member]').forEach(b => b.addEventListener('click', () => this.confirmDeleteMember(b.dataset.deleteMember)));

    // 任务管理
    const allTasks = Store.getTasks();
    const earnTasks = allTasks.filter(t => t.type !== 'penalty');
    const penaltyTasks = allTasks.filter(t => t.type === 'penalty');
    const taskEl = document.getElementById('profileTaskList');
    let taskHtml = '';
    if (earnTasks.length > 0) {
      taskHtml += earnTasks.map(t => `<div class="profile-item">
        <div class="profile-item-icon" style="background:var(--earn-bg)">${t.icon}</div>
        <div class="profile-item-info"><div class="profile-item-name">${this.escape(t.name)}</div><div class="profile-item-meta">+¥${t.amount.toFixed(1)}</div></div>
        <div class="profile-item-actions"><button class="icon-btn" data-edit-task="${t.id}">✏️</button><button class="icon-btn" data-delete-task="${t.id}">🗑️</button></div>
      </div>`).join('');
    }
    if (penaltyTasks.length > 0) {
      taskHtml += penaltyTasks.map(t => `<div class="profile-item">
        <div class="profile-item-icon" style="background:var(--penalty-bg)">${t.icon}</div>
        <div class="profile-item-info"><div class="profile-item-name">${this.escape(t.name)}</div><div class="profile-item-meta">-¥${Math.abs(t.amount).toFixed(1)}</div></div>
        <div class="profile-item-actions"><button class="icon-btn" data-edit-task="${t.id}">✏️</button><button class="icon-btn" data-delete-task="${t.id}">🗑️</button></div>
      </div>`).join('');
    }
    if (!taskHtml) taskHtml = `<div class="empty-state" style="padding:16px"><div class="empty-state-text">还没有任务</div></div>`;
    taskEl.innerHTML = taskHtml;
    taskEl.querySelectorAll('[data-edit-task]').forEach(b => b.addEventListener('click', () => this.openTaskModal(b.dataset.editTask)));
    taskEl.querySelectorAll('[data-delete-task]').forEach(b => b.addEventListener('click', () => this.confirmDeleteTask(b.dataset.deleteTask)));

    // 基础零花钱任务
    const basicTasks = Store.getBasicTasks();
    const basicEl = document.getElementById('profileBasicList');
    basicEl.innerHTML = basicTasks.length === 0
      ? `<div class="empty-state" style="padding:16px"><div class="empty-state-text">还没有基础任务</div></div>`
      : basicTasks.map(t => `<div class="profile-item">
          <div class="profile-item-icon" style="background:#FFF8E1">${t.icon}</div>
          <div class="profile-item-info"><div class="profile-item-name">${this.escape(t.name)}</div></div>
          <div class="profile-item-actions"><button class="icon-btn" data-edit-basic="${t.id}">✏️</button><button class="icon-btn" data-delete-basic="${t.id}">🗑️</button></div>
        </div>`).join('');
    basicEl.querySelectorAll('[data-edit-basic]').forEach(b => b.addEventListener('click', () => this.openBasicTaskModal(b.dataset.editBasic)));
    basicEl.querySelectorAll('[data-delete-basic]').forEach(b => b.addEventListener('click', () => this.confirmDeleteBasicTask(b.dataset.deleteBasic)));

    // 设置
    const settings = Store.getSettings();
    document.getElementById('weeklyBaseDisplay').textContent = `¥${settings.weeklyBaseAmount} / 周`;

    // 清除缓存按钮
    const clearBtn = document.getElementById('btnClearCache');
    if (clearBtn) clearBtn.addEventListener('click', () => this.clearCache());
  },

  renderAchievements() {
    const memberId = this.state.selectedMemberId;
    const container = document.getElementById('achievementWall');
    if (!container) return;

    if (!memberId) {
      container.innerHTML = `<div class="empty-state" style="padding:16px"><div class="empty-state-text">请先选择成员查看成就</div></div>`;
      return;
    }

    const allAchievements = Store.getAllAchievements(memberId);
    const streak = Store.getMemberStreak(memberId);
    const stats = Store.getMemberStats(memberId);
    const unlockedCount = allAchievements.filter(a => a.unlocked).length;

    // 按类别分组
    const categories = [
      { key: 'streak',    label: '🔥 打卡坚持', items: allAchievements.filter(a => a.category === 'streak') },
      { key: 'wealth',    label: '💰 财富积累', items: allAchievements.filter(a => a.category === 'wealth') },
      { key: 'diligent',  label: '🧹 勤劳之星', items: allAchievements.filter(a => a.category === 'diligent') },
      { key: 'milestone', label: '⭐ 里程碑',   items: allAchievements.filter(a => a.category === 'milestone') },
    ];

    let html = `
      <div class="ach-stats-bar">
        <div class="ach-stat-item">
          <div class="ach-stat-icon">🔥</div>
          <div class="ach-stat-value">${streak.currentStreak}</div>
          <div class="ach-stat-label">连续天数</div>
        </div>
        <div class="ach-stat-item">
          <div class="ach-stat-icon">👑</div>
          <div class="ach-stat-value">${streak.bestStreak}</div>
          <div class="ach-stat-label">最佳记录</div>
        </div>
        <div class="ach-stat-item">
          <div class="ach-stat-icon">🏅</div>
          <div class="ach-stat-value">${unlockedCount}/${allAchievements.length}</div>
          <div class="ach-stat-label">已解锁</div>
        </div>
        <div class="ach-stat-item">
          <div class="ach-stat-icon">📋</div>
          <div class="ach-stat-value">${stats.totalTasks}</div>
          <div class="ach-stat-label">总任务数</div>
        </div>
      </div>`;

    categories.forEach(cat => {
      html += `<div class="ach-category-title">${cat.label}</div>`;
      html += `<div class="ach-grid">`;
      cat.items.forEach(item => {
        html += `
          <div class="ach-card ${item.unlocked ? 'unlocked' : 'locked'}">
            <div class="ach-card-icon" style="${item.unlocked ? `background:${item.color}22;color:${item.color}` : ''}">${item.unlocked ? item.icon : '🔒'}</div>
            <div class="ach-card-info">
              <div class="ach-card-name">${item.name}</div>
              <div class="ach-card-desc">${item.desc}</div>
            </div>
            ${item.unlocked ? '<div class="ach-card-check">✅</div>' : ''}
          </div>`;
      });
      html += `</div>`;
    });

    container.innerHTML = html;
  },

  clearCache() {
    this.openConfirm('确定清除全部数据吗？所有成员、任务、记录、心愿都会被删除，不可恢复！', () => {
      Store.clearAll();
      this.state.selectedMemberId = null;
      this.state.selectedMember = null;
      this.renderAll();
      this.toast('缓存已清除', 'success');
    });
  },

  openWeeklyBaseModal() {
    const settings = Store.getSettings();
    document.getElementById('modalTitle').textContent = '每周基础零花钱';
    document.getElementById('modalBody').innerHTML = `
      <div class="form-group"><label class="form-label">金额（元/周）</label>
        <input type="number" class="form-input" id="weeklyBaseInput" value="${settings.weeklyBaseAmount}" min="0" max="999" step="0.5"></div>
      <div class="form-actions"><button class="btn btn-cancel" id="formCancelBtn">取消</button><button class="btn btn-primary" id="formSaveBtn">保存</button></div>
    `;
    document.getElementById('formCancelBtn').addEventListener('click', () => this.closeModal());
    document.getElementById('formSaveBtn').addEventListener('click', () => {
      const v = parseFloat(document.getElementById('weeklyBaseInput').value) || 0;
      Store.updateSettings({ weeklyBaseAmount: v });
      this.toast('已更新', 'success');
      this.closeModal();
      this.renderProfile();
    });
    this.openModal();
  },

  // ==================== 成员管理弹窗 ====================

  openMemberModal(memberId = null) {
    this.state.editingType = 'member'; this.state.editingId = memberId;
    const isEdit = !!memberId;
    const member = isEdit ? Store.getMember(memberId) : null;
    if (isEdit && !member) return;

    document.getElementById('modalTitle').textContent = isEdit ? '编辑成员' : '添加成员';
    const name = member ? member.name : '';
    const currentEmoji = member ? member.avatar : '👤';
    const currentColor = member ? member.color : this.memberColors[0];
    this.state.selectedEmoji = currentEmoji;
    this.state.selectedColor = currentColor;

    document.getElementById('modalBody').innerHTML = `
      <div class="form-group"><label class="form-label">成员名称</label>
        <input type="text" class="form-input" id="memberNameInput" placeholder="如：爸爸、妈妈、小明" value="${this.escape(name)}" maxlength="10"></div>
      <div class="form-group"><label class="form-label">选择头像</label>
        <div class="emoji-picker" id="emojiPicker">${this.memberEmojis.map(e => `<div class="emoji-option ${e===currentEmoji?'selected':''}" data-emoji="${e}">${e}</div>`).join('')}</div></div>
      <div class="form-group"><label class="form-label">选择颜色</label>
        <div class="color-picker" id="colorPicker">${this.memberColors.map(c => `<div class="color-option ${c===currentColor?'selected':''}" data-color="${c}" style="background:${c}"></div>`).join('')}</div></div>
      <div class="form-actions"><button class="btn btn-cancel" id="formCancelBtn">取消</button><button class="btn btn-primary" id="formSaveBtn">${isEdit?'保存':'添加'}</button></div>
    `;

    document.querySelectorAll('#emojiPicker .emoji-option').forEach(el => {
      el.addEventListener('click', () => {
        document.querySelectorAll('#emojiPicker .emoji-option').forEach(e => e.classList.remove('selected'));
        el.classList.add('selected'); this.state.selectedEmoji = el.dataset.emoji;
      });
    });
    document.querySelectorAll('#colorPicker .color-option').forEach(el => {
      el.addEventListener('click', () => {
        document.querySelectorAll('#colorPicker .color-option').forEach(e => e.classList.remove('selected'));
        el.classList.add('selected'); this.state.selectedColor = el.dataset.color;
      });
    });
    document.getElementById('formCancelBtn').addEventListener('click', () => this.closeModal());
    document.getElementById('formSaveBtn').addEventListener('click', () => this.saveMember());
    this.openModal();
  },

  saveMember() {
    const name = document.getElementById('memberNameInput').value.trim();
    if (!name) { this.toast('请输入成员名称', 'error'); return; }
    const data = { name, avatar: this.state.selectedEmoji || '👤', color: this.state.selectedColor || this.memberColors[0] };
    if (this.state.editingId) { Store.updateMember(this.state.editingId, data); this.toast('成员已更新', 'success'); }
    else { Store.addMember(data); this.toast('成员已添加', 'success'); }
    this.closeModal();
    this.renderMemberBar();
    this.renderProfile();
  },

  confirmDeleteMember(memberId) {
    const member = Store.getMember(memberId);
    if (!member) return;
    this.openConfirm(`确定删除「${member.name}」？所有记录也会被删除。`, () => {
      Store.deleteMember(memberId);
      if (this.state.selectedMemberId === memberId) {
        const members = Store.getMembers();
        this.state.selectedMemberId = members.length > 0 ? members[0].id : null;
      }
      this.toast('成员已删除', 'success');
      this.renderMemberBar();
      this.renderProfile();
      this.renderCurrentView();
    });
  },

  // ==================== 任务管理弹窗 ====================

  openTaskModal(taskId = null, defaultType = 'earn') {
    this.state.editingType = 'task'; this.state.editingId = taskId;
    const isEdit = !!taskId;
    const task = isEdit ? Store.getTask(taskId) : null;
    if (isEdit && !task) return;
    this.state.taskType = task ? task.type : defaultType;

    document.getElementById('modalTitle').textContent = isEdit ? '编辑任务' : '添加任务';
    const name = task ? task.name : '';
    const amount = task ? Math.abs(task.amount) : 1;
    const currentIcon = task ? task.icon : (this.state.taskType === 'penalty' ? '⚠️' : '🧹');
    this.state.selectedEmoji = currentIcon;
    const emojis = this.state.taskType === 'penalty' ? this.penaltyEmojis : this.taskEmojis;

    document.getElementById('modalBody').innerHTML = `
      ${isEdit ? '' : `<div class="type-toggle" id="typeToggle">
        <div class="type-option ${this.state.taskType==='earn'?'active earn':''}" data-type="earn">💰 赚钱</div>
        <div class="type-option ${this.state.taskType==='penalty'?'active penalty':''}" data-type="penalty">⚠️ 扣款</div>
      </div>`}
      <div class="form-group"><label class="form-label">${this.state.taskType==='penalty'?'扣款名称':'任务名称'}</label>
        <input type="text" class="form-input" id="taskNameInput" placeholder="${this.state.taskType==='penalty'?'如：说脏话':'如：洗碗'}" value="${this.escape(name)}" maxlength="15"></div>
      <div class="form-group"><label class="form-label">金额（元）</label>
        <input type="number" class="form-input" id="taskAmountInput" value="${amount}" min="0.1" max="999" step="0.1"></div>
      <div class="form-group"><label class="form-label">选择图标</label>
        <div class="emoji-picker" id="emojiPicker">${emojis.map(e => `<div class="emoji-option ${e===currentIcon?'selected':''}" data-emoji="${e}">${e}</div>`).join('')}</div></div>
      <div class="form-actions"><button class="btn btn-cancel" id="formCancelBtn">取消</button><button class="btn btn-primary" id="formSaveBtn">${isEdit?'保存':'添加'}</button></div>
    `;

    if (!isEdit) {
      document.querySelectorAll('#typeToggle .type-option').forEach(el => {
        el.addEventListener('click', () => {
          if (el.dataset.type === this.state.taskType) return;
          this.state.taskType = el.dataset.type;
          this.closeModal(); this.openTaskModal(null, el.dataset.type);
        });
      });
    }
    document.querySelectorAll('#emojiPicker .emoji-option').forEach(el => {
      el.addEventListener('click', () => {
        document.querySelectorAll('#emojiPicker .emoji-option').forEach(e => e.classList.remove('selected'));
        el.classList.add('selected'); this.state.selectedEmoji = el.dataset.emoji;
      });
    });
    document.getElementById('formCancelBtn').addEventListener('click', () => this.closeModal());
    document.getElementById('formSaveBtn').addEventListener('click', () => this.saveTask());
    this.openModal();
  },

  saveTask() {
    const name = document.getElementById('taskNameInput').value.trim();
    const amount = parseFloat(document.getElementById('taskAmountInput').value) || 0.1;
    if (!name) { this.toast('请输入任务名称', 'error'); return; }
    const data = { name, icon: this.state.selectedEmoji || (this.state.taskType==='penalty'?'⚠️':'🧹'),
      amount: this.state.taskType==='penalty' ? -Math.abs(amount) : Math.abs(amount), type: this.state.taskType };
    if (this.state.editingId) { Store.updateTask(this.state.editingId, data); this.toast('任务已更新', 'success'); }
    else { Store.addTask(data); this.toast('任务已添加', 'success'); }
    this.closeModal();
    this.renderProfile();
    if (this.state.currentView === 'home') this.renderHome();
  },

  confirmDeleteTask(taskId) {
    const task = Store.getTask(taskId);
    if (!task) return;
    this.openConfirm(`确定删除「${task.name}」？`, () => {
      Store.deleteTask(taskId); this.toast('已删除', 'success');
      this.renderProfile(); if (this.state.currentView === 'home') this.renderHome();
    });
  },

  // ==================== 基础零花钱弹窗 ====================

  openBasicTaskModal(taskId = null) {
    this.state.editingType = 'basicTask'; this.state.editingId = taskId;
    const isEdit = !!taskId;
    const task = isEdit ? Store.getBasicTask(taskId) : null;
    if (isEdit && !task) return;

    document.getElementById('modalTitle').textContent = isEdit ? '编辑基础任务' : '添加基础任务';
    const name = task ? task.name : '';
    const currentIcon = task ? task.icon : '✅';
    this.state.selectedEmoji = currentIcon;

    document.getElementById('modalBody').innerHTML = `
      <div class="form-group"><label class="form-label">任务名称</label>
        <input type="text" class="form-input" id="basicTaskNameInput" value="${this.escape(name)}" maxlength="30"></div>
      <div class="form-group"><label class="form-label">选择图标</label>
        <div class="emoji-picker" id="emojiPicker">${this.taskEmojis.map(e => `<div class="emoji-option ${e===currentIcon?'selected':''}" data-emoji="${e}">${e}</div>`).join('')}</div></div>
      <div class="form-actions"><button class="btn btn-cancel" id="formCancelBtn">取消</button><button class="btn btn-primary" id="formSaveBtn">${isEdit?'保存':'添加'}</button></div>
    `;
    document.querySelectorAll('#emojiPicker .emoji-option').forEach(el => {
      el.addEventListener('click', () => {
        document.querySelectorAll('#emojiPicker .emoji-option').forEach(e => e.classList.remove('selected'));
        el.classList.add('selected'); this.state.selectedEmoji = el.dataset.emoji;
      });
    });
    document.getElementById('formCancelBtn').addEventListener('click', () => this.closeModal());
    document.getElementById('formSaveBtn').addEventListener('click', () => this.saveBasicTask());
    this.openModal();
  },

  saveBasicTask() {
    const name = document.getElementById('basicTaskNameInput').value.trim();
    if (!name) { this.toast('请输入任务名称', 'error'); return; }
    const data = { name, icon: this.state.selectedEmoji || '✅' };
    if (this.state.editingId) { Store.updateBasicTask(this.state.editingId, data); this.toast('已更新', 'success'); }
    else { Store.addBasicTask(data); this.toast('已添加', 'success'); }
    this.closeModal(); this.renderProfile();
  },

  confirmDeleteBasicTask(taskId) {
    const task = Store.getBasicTask(taskId);
    if (!task) return;
    this.openConfirm(`确定删除「${task.name}」？`, () => { Store.deleteBasicTask(taskId); this.toast('已删除', 'success'); this.renderProfile(); });
  },

  // ==================== 奖励管理（奖励商店 + 心愿） ====================

  renderRewardsView() {
    this.renderRewards();
    this.renderWishes();
    this.renderAchievements();
  },

  renderRewards() {
    const rewards = Store.getRewards();
    const container = document.getElementById('rewardList');
    if (rewards.length === 0) { container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🎁</div><div class="empty-state-text">还没有奖励</div></div>`; return; }
    container.innerHTML = rewards.map(r => `
      <div class="reward-card">
        <div class="reward-icon">${r.icon}</div>
        <div class="reward-info"><div class="reward-name">${this.escape(r.name)}</div>${r.description?`<div class="reward-desc">${this.escape(r.description)}</div>`:''}</div>
        <div class="reward-actions">
          <div class="reward-cost">¥${r.amount.toFixed(1)}</div>
          <button class="btn-redeem" data-redeem="${r.id}">兑换</button>
          <div style="display:flex;gap:4px">
            <button class="icon-btn" data-edit-reward="${r.id}">✏️</button>
            <button class="icon-btn" data-delete-reward="${r.id}">🗑️</button>
          </div>
        </div>
      </div>`).join('');
    container.querySelectorAll('[data-redeem]').forEach(b => b.addEventListener('click', () => this.openRedeemModal(b.dataset.redeem)));
    container.querySelectorAll('[data-edit-reward]').forEach(b => b.addEventListener('click', (e) => { e.stopPropagation(); this.openRewardModal(b.dataset.editReward); }));
    container.querySelectorAll('[data-delete-reward]').forEach(b => b.addEventListener('click', (e) => { e.stopPropagation(); this.confirmDeleteReward(b.dataset.deleteReward); }));
  },

  openRewardModal(rewardId = null) {
    this.state.editingType = 'reward'; this.state.editingId = rewardId;
    const isEdit = !!rewardId;
    const reward = isEdit ? Store.getReward(rewardId) : null;
    if (isEdit && !reward) return;
    document.getElementById('modalTitle').textContent = isEdit ? '编辑奖励' : '添加奖励';
    const currentIcon = reward ? reward.icon : '🎁';
    this.state.selectedEmoji = currentIcon;

    document.getElementById('modalBody').innerHTML = `
      <div class="form-group"><label class="form-label">奖励名称</label><input type="text" class="form-input" id="rewardNameInput" value="${this.escape(reward?reward.name:'')}" maxlength="15"></div>
      <div class="form-group"><label class="form-label">所需金额（元）</label><input type="number" class="form-input" id="rewardAmountInput" value="${reward?reward.amount:5}" min="0.1" max="9999" step="0.1"></div>
      <div class="form-group"><label class="form-label">描述（可选）</label><textarea class="form-textarea" id="rewardDescInput" maxlength="50">${this.escape(reward?reward.description:'')}</textarea></div>
      <div class="form-group"><label class="form-label">选择图标</label><div class="emoji-picker" id="emojiPicker">${this.rewardEmojis.map(e => `<div class="emoji-option ${e===currentIcon?'selected':''}" data-emoji="${e}">${e}</div>`).join('')}</div></div>
      <div class="form-actions"><button class="btn btn-cancel" id="formCancelBtn">取消</button><button class="btn btn-primary" id="formSaveBtn">${isEdit?'保存':'添加'}</button></div>
    `;
    document.querySelectorAll('#emojiPicker .emoji-option').forEach(el => {
      el.addEventListener('click', () => { document.querySelectorAll('#emojiPicker .emoji-option').forEach(e => e.classList.remove('selected')); el.classList.add('selected'); this.state.selectedEmoji = el.dataset.emoji; });
    });
    document.getElementById('formCancelBtn').addEventListener('click', () => this.closeModal());
    document.getElementById('formSaveBtn').addEventListener('click', () => this.saveReward());
    this.openModal();
  },

  saveReward() {
    const name = document.getElementById('rewardNameInput').value.trim();
    const amount = parseFloat(document.getElementById('rewardAmountInput').value) || 1;
    if (!name) { this.toast('请输入奖励名称', 'error'); return; }
    const data = { name, icon: this.state.selectedEmoji || '🎁', amount: Math.max(0.1, amount), description: document.getElementById('rewardDescInput').value.trim() };
    if (this.state.editingId) { Store.updateReward(this.state.editingId, data); this.toast('已更新', 'success'); }
    else { Store.addReward(data); this.toast('已添加', 'success'); }
    this.closeModal(); this.renderRewardsView();
  },

  confirmDeleteReward(id) {
    const r = Store.getReward(id);
    if (!r) return;
    this.openConfirm(`确定删除「${r.name}」？`, () => { Store.deleteReward(id); this.toast('已删除', 'success'); this.renderRewardsView(); });
  },

  openRedeemModal(rewardId) {
    const reward = Store.getReward(rewardId);
    if (!reward) return;
    const members = Store.getMembers();
    this.state.selectedReward = rewardId;
    this.state.selectedMember = null;
    document.getElementById('modalTitle').textContent = `兑换：${reward.name}`;

    document.getElementById('modalBody').innerHTML = `
      <div class="form-group"><label class="form-label">需 ¥${reward.amount.toFixed(1)}，选择成员</label>
        <div class="checkin-grid" id="redeemMemberGrid">
          ${members.map(m => { const bal = Store.getMemberBalance(m.id); return `<div class="checkin-option ${bal<reward.amount?'disabled':''}" data-member-id="${m.id}" style="${bal<reward.amount?'opacity:0.5':''}"><span>${m.avatar}</span><span class="checkin-option-name">${this.escape(m.name)}</span><span class="checkin-option-name" style="color:${bal>=reward.amount?'var(--earn)':'var(--penalty)'}">¥${bal.toFixed(1)}</span></div>`; }).join('')}
        </div>
      </div>
      <div class="form-actions"><button class="btn btn-cancel" id="formCancelBtn">取消</button><button class="btn btn-primary" id="redeemSubmitBtn">确认兑换</button></div>
    `;
    document.querySelectorAll('#redeemMemberGrid .checkin-option').forEach(el => {
      el.addEventListener('click', () => {
        if (el.classList.contains('disabled')) return;
        document.querySelectorAll('#redeemMemberGrid .checkin-option').forEach(e => e.classList.remove('selected'));
        el.classList.add('selected'); this.state.selectedMember = el.dataset.memberId;
      });
    });
    document.getElementById('formCancelBtn').addEventListener('click', () => this.closeModal());
    document.getElementById('redeemSubmitBtn').addEventListener('click', () => this.submitRedeem());
    this.openModal();
  },

  submitRedeem() {
    if (!this.state.selectedMember) { this.toast('请选择成员', 'error'); return; }
    const result = Store.addRedemption({ memberId: this.state.selectedMember, rewardId: this.state.selectedReward });
    if (!result || result.error) { this.toast(result.error || '兑换失败', 'error'); return; }
    const member = Store.getMember(this.state.selectedMember);
    this.closeModal();
    this.showConfetti();
    this.toast(`${member.name} 兑换成功！-¥${result.amount.toFixed(1)}`, 'success');
    this.renderRewardsView(); this.renderMemberBar();
    this.checkAndNotify(this.state.selectedMember);
  },

  // ==================== 收入统计 ====================

  _incomeState: { period: 'week' },

  renderIncome() {
    const tabs = document.getElementById('incomePeriodTabs');
    if (tabs && !tabs._bound) {
      tabs._bound = true;
      tabs.querySelectorAll('.income-period-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          tabs.querySelectorAll('.income-period-tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          this._incomeState.period = tab.dataset.period;
          this.renderIncome();
        });
      });
    }

    const period = this._incomeState.period;
    let stats;
    if (period === 'week') stats = Store.getWeekStats(0);
    else if (period === 'month') stats = Store.getMonthStats(0);
    else stats = Store.getYearStats(0);

    const container = document.getElementById('incomeContent');
    if (!container) return;

    const netIncome = stats.netIncome || 0;
    const coinHtml = this._buildCoinDisplay(netIncome);

    let html = `<div class="income-overview-card">
      <div class="income-overview-label">${stats.label} · 净收入</div>
      <div class="income-overview-net">¥${netIncome.toFixed(1)}</div>
      <div class="income-overview-detail">
        <span>📈 ¥${(stats.totalEarned||0).toFixed(1)}</span>
        ${(stats.totalPenalty||0)>0?`<span>📉 ¥${stats.totalPenalty.toFixed(1)}</span>`:''}
        ${(stats.totalSpent||0)>0?`<span>🛒 ¥${stats.totalSpent.toFixed(1)}</span>`:''}
        <span>📋 ${stats.totalTasks||0}条</span>
      </div>
    </div>${coinHtml}`;

    // 📅 日历视图（周/月）
    if (period === 'week' || period === 'month') {
      html += this._buildCalendar(period, stats.label);
    }

    const memberStats = stats.memberStats || [];
    if (memberStats.length > 0) {
      const maxAmt = Math.max(...memberStats.map(m => Math.abs(m.balance||0)), 0.01);
      html += `<div class="stats-section-title">👥 成员收入</div>`;
      html += memberStats.map(m => {
        const b = m.balance || 0;
        const coins = this._buildSmallCoins(b, maxAmt);
        return `<div class="income-member-card" style="--member-color:${m.color}">
          <div class="income-member-avatar" style="color:${m.color}">${m.avatar}</div>
          <div class="income-member-info"><div class="income-member-name">${this.escape(m.name)}</div><div class="income-member-coins">${coins}</div></div>
          <div class="income-member-amount"><div class="income-member-total ${b<0?'negative':''}">¥${b.toFixed(1)}</div><div class="income-member-breakdown">+¥${m.earned.toFixed(1)}${m.penalty>0?` -¥${m.penalty.toFixed(1)}`:''}${m.spent>0?` 🛒¥${m.spent.toFixed(1)}`:''}</div></div>
        </div>`;
      }).join('');
    }

    if (period === 'year' && memberStats.length > 0 && memberStats[0].monthlyBreakdown) {
      const fm = memberStats[0];
      html += `<div class="stats-section-title" style="margin-top:10px">📅 ${this.escape(fm.name)} 月度趋势</div><div class="income-monthly-grid">`;
      html += fm.monthlyBreakdown.map(mb => {
        let c = 'zero'; if (mb.balance>0) c='positive'; else if (mb.balance<0) c='negative';
        return `<div class="income-monthly-cell"><div class="month-label">${mb.month}月</div><div class="month-value ${c}">${mb.balance!==0?`¥${mb.balance.toFixed(1)}`:'-'}</div></div>`;
      }).join('');
      html += `</div>`;
    }

    if (stats.totalTasks === 0) {
      html += `<div class="empty-state" style="margin-top:10px"><div class="empty-state-icon">💰</div><div class="empty-state-text">${stats.label}还没有记录</div></div>`;
    }
    container.innerHTML = html;
  },

  _buildCoinDisplay(amount) {
    if (Math.abs(amount) < 0.05) return `<div class="coin-display"><span style="color:var(--text-3);font-size:12px">还没有收入记录 🪙</span></div>`;
    const absAmt = Math.abs(amount);
    const fullCoins = Math.floor(absAmt);
    const isNeg = amount < 0;
    let coins = '';
    for (let i = 0; i < Math.min(fullCoins, 30); i++) {
      coins += `<span class="coin">${isNeg?'💸':'💰'}</span>`;
      if ((i+1) % 10 === 0 && i < fullCoins-1) coins += `<span class="coin-row-break"></span>`;
    }
    if (fullCoins > 30) coins += `<span style="font-size:12px;color:var(--text-2)">...共${fullCoins}枚</span>`;
    return `<div class="coin-display">
      <div style="text-align:center;font-size:10px;color:var(--text-3);margin-bottom:3px;width:100%">💰 每枚 = ¥1 · ${isNeg?'净支出':'净收入'} ${absAmt.toFixed(1)}元</div>
      ${coins}
    </div>`;
  },

  _buildCalendar(period, label) {
    const today = new Date();
    if (period === 'week') return this._buildWeekCalendar(today, label);
    return this._buildMonthCalendar(today, label);
  },

  _getDailyNetIncome(startDate, endDate) {
    const records = Store.getRecordsByDateRange(startDate, endDate);
    const spendingMap = Store.getDailySpendingMap(startDate, endDate);
    const map = {};
    records.forEach(r => {
      map[r.date] = (map[r.date] || 0) + r.amount;
    });
    for (const [date, spent] of Object.entries(spendingMap)) {
      map[date] = (map[date] || 0) - spent;
    }
    return map;
  },

  _buildWeekCalendar(today, label) {
    // 计算本周一
    const d = new Date(today);
    const dayOfWeek = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    const weekDays = ['一', '二', '三', '四', '五', '六', '日'];
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const dt = new Date(monday);
      dt.setDate(monday.getDate() + i);
      dates.push(dt);
    }

    const startStr = dates[0].toISOString().slice(0, 10);
    const endStr = dates[6].toISOString().slice(0, 10);
    const dailyMap = this._getDailyNetIncome(startStr, endStr);
    const todayStr = today.toISOString().slice(0, 10);

    let html = `<div class="stats-section-title">📅 ${label} · 日历</div><div class="calendar-week">`;
    html += dates.map(dt => {
      const ds = dt.toISOString().slice(0, 10);
      const val = dailyMap[ds] || 0;
      const isToday = ds === todayStr;
      let cls = 'cal-day-empty';
      if (val > 0) cls = 'cal-day-positive';
      else if (val < 0) cls = 'cal-day-negative';
      return `<div class="cal-day-cell ${cls} ${isToday ? 'cal-day-today' : ''}">
        <div class="cal-day-name">${weekDays[dt.getDay() === 0 ? 6 : dt.getDay() - 1]}</div>
        <div class="cal-day-num">${dt.getDate()}</div>
        <div class="cal-day-amount">${val !== 0 ? (val > 0 ? '+' : '') + '¥' + val.toFixed(1) : '—'}</div>
      </div>`;
    }).join('');
    html += `</div>`;
    return html;
  },

  _buildMonthCalendar(today, label) {
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startStr = firstDay.toISOString().slice(0, 10);
    const endStr = lastDay.toISOString().slice(0, 10);
    const dailyMap = this._getDailyNetIncome(startStr, endStr);
    const todayStr = today.toISOString().slice(0, 10);

    // 当月1号是星期几 (0=日, 1=一, ... 6=六)
    let startDow = firstDay.getDay();
    startDow = startDow === 0 ? 6 : startDow - 1; // 转为 0=一, 6=日

    const weekHeaders = ['一', '二', '三', '四', '五', '六', '日'];
    let html = `<div class="stats-section-title">📅 ${label} · 日历</div><div class="calendar-month">`;
    html += `<div class="cal-month-header">${weekHeaders.map(w => `<span>${w}</span>`).join('')}</div>`;

    const totalDays = lastDay.getDate();
    const totalCells = startDow + totalDays;
    const rows = Math.ceil(totalCells / 7);

    let dayCount = 0;
    for (let r = 0; r < rows; r++) {
      html += `<div class="cal-row">`;
      for (let c = 0; c < 7; c++) {
        dayCount++;
        if (dayCount <= startDow || dayCount > totalCells) {
          html += `<div class="cal-day-cell cal-day-placeholder"></div>`;
        } else {
          const dayNum = dayCount - startDow;
          const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
          const val = dailyMap[ds] || 0;
          const isToday = ds === todayStr;
          let cls = 'cal-day-empty';
          if (val > 0) cls = 'cal-day-positive';
          else if (val < 0) cls = 'cal-day-negative';
          html += `<div class="cal-day-cell ${cls} ${isToday ? 'cal-day-today' : ''}">
            <div class="cal-day-num">${dayNum}</div>
            <div class="cal-day-amount">${val !== 0 ? (val > 0 ? '+' : '') + '¥' + Math.abs(val).toFixed(1) : ''}</div>
          </div>`;
        }
      }
      html += `</div>`;
    }
    html += `</div>`;
    return html;
  },

  _buildSmallCoins(amount, maxAmount) {
    if (Math.abs(amount) < 0.05) return '<span style="font-size:10px;color:var(--text-3)">—</span>';
    const total = Math.min(Math.round(Math.abs(amount)/(maxAmount/8)), 8);
    if (total === 0) return '<span style="font-size:11px">🪙</span>';
    let c = '';
    for (let i = 0; i < total; i++) c += `<span class="coin">${amount<0?'💸':'💰'}</span>`;
    return c;
  },

  // ==================== 数据导入导出 ====================

  exportData() {
    const data = Store.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `家庭赚钱指南_${Store._todayStr()}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    this.toast('数据已导出', 'success');
  },

  triggerImport() { document.getElementById('importFile').click(); },

  handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (Store.importAll(ev.target.result)) { this.toast('导入成功', 'success'); this.renderAll(); }
      else this.toast('导入失败', 'error');
    };
    reader.readAsText(file);
    e.target.value = '';
  },

  loadSampleData() {
    this.openConfirm('加载示例数据会清空当前数据，确定继续？', () => {
      Store.clearAll(); Store.initSampleData();
      this.toast('示例数据已加载', 'success');
      this.state.selectedMemberId = null; this.renderAll();
    });
  },

  checkAndNotify(memberId) {
    const newlyUnlocked = Store.checkAchievements(memberId);
    if (newlyUnlocked.length === 0) return;

    // 打卡类成就可能有金币奖励
    newlyUnlocked.forEach(ach => {
      let bonus = 0;
      if (ach.id === 'streak_7') bonus = 3;
      if (ach.id === 'streak_30') bonus = 10;

      if (bonus > 0) {
        const records = Store.getRecords();
        records.push({
          id: Store._uid(), memberId, taskId: 'achievement',
          taskName: `成就奖励：${ach.name}`, taskIcon: ach.icon,
          amount: bonus, recordType: 'earn', date: Store._todayStr(),
          timestamp: Date.now(), note: '连续打卡奖励',
        });
        Store._write(Store.KEYS.RECORDS, records);
      }
    });

    // 弹窗通知
    this.showAchievementToast(newlyUnlocked);
  },

  showAchievementToast(achievements) {
    // 一次只展示一个（最新的），避免堆叠
    const ach = achievements[achievements.length - 1];
    // 若基础零花钱到账弹窗正在显示，错峰等待它关闭后再弹成就通知，避免互相覆盖
    const basicClaimEl = document.getElementById('basicClaimToast');
    const wait = !!(basicClaimEl && basicClaimEl.classList.contains('show'));
    const show = () => {
      const container = document.getElementById('achievementToast');
      if (!container) return;
      container.innerHTML = `
        <div class="ach-toast-card">
          <div class="ach-toast-badge" style="background:${ach.color}22;color:${ach.color}">${ach.icon}</div>
          <div class="ach-toast-title">🏅 成就解锁！</div>
          <div class="ach-toast-name" style="color:${ach.color}">${ach.name}</div>
          <div class="ach-toast-desc">${ach.desc}</div>
          <button class="ach-toast-btn" onclick="document.getElementById('achievementToast').innerHTML=''">知道啦 ✨</button>
        </div>`;
      // 5秒后自动消失
      setTimeout(() => { container.innerHTML = ''; }, 5000);
    };
    if (wait) setTimeout(show, 3900);
    else show();
  },

  // 基础零花钱到账弹窗（与成就解锁同款风格）
  showBasicClaimToast(amount) {
    const container = document.getElementById('basicClaimToast');
    if (!container) return;
    container.innerHTML = `
      <div class="basic-claim-card">
        <div class="basic-claim-badge">💵</div>
        <div class="basic-claim-title">🎉 本周基础零花钱到账！</div>
        <div class="basic-claim-amount">+¥${amount.toFixed(1)}</div>
        <button class="basic-claim-btn" id="btnBasicClaimClose">知道啦 ✨</button>
      </div>`;
    // 同步加 class 立即显示（display 切换必定触发重绘，不依赖 rAF/过渡动画）
    container.classList.add('show');
    const close = () => {
      container.classList.remove('show');
      container.innerHTML = '';
    };
    const btn = document.getElementById('btnBasicClaimClose');
    if (btn) btn.onclick = close;
    clearTimeout(this._basicClaimTimer);
    this._basicClaimTimer = setTimeout(close, 3800);
  },

  // 金额从按钮位置飞到目标元素（余额卡片）
  flyAmountToCard(amount, startRect, targetEl) {
    if (!startRect || !targetEl) return;
    const tRect = targetEl.getBoundingClientRect();
    const startX = startRect.left + startRect.width / 2;
    const startY = startRect.top + startRect.height / 2;
    const endX = tRect.left + tRect.width / 2;
    const endY = tRect.top + tRect.height / 2;
    const el = document.createElement('div');
    el.className = 'fly-amount';
    el.textContent = '+¥' + amount.toFixed(1);
    el.style.left = startX + 'px';
    el.style.top = startY + 'px';
    el.style.transform = 'translate(-50%, -50%) scale(1.1)';
    document.body.appendChild(el);
    void el.offsetWidth; // 强制重排，确保起始位置生效
    el.style.transform = `translate(-50%, -50%) translate(${endX - startX}px, ${endY - startY}px) scale(0.4)`;
    el.style.opacity = '0.15';
    setTimeout(() => el.remove(), 900);
  },

  // 数字滚动动画（easeOutCubic）
  rollNumber(el, from, to, duration = 850) {
    if (!el) return;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = from + (to - from) * eased;
      el.textContent = '¥' + val.toFixed(1);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = '¥' + to.toFixed(1);
    };
    requestAnimationFrame(step);
  },

  // 临时：预览到账动画（不依赖基础任务全部完成）
  previewClaimAnimation() {
    const amount = 5;
    const overviewEl = document.getElementById('overviewCards');
    const balValEl = overviewEl ? overviewEl.querySelector('.overview-card-value') : null;
    const btn = document.getElementById('btnPreviewClaim');
    this.showConfetti();
    this.showBasicClaimToast(amount);
    if (overviewEl && btn) {
      this.flyAmountToCard(amount, btn.getBoundingClientRect(), overviewEl);
    }
    const memberId = this.state.selectedMemberId;
    if (balValEl && memberId) {
      const cur = Store.getMemberBalance(memberId);
      this.rollNumber(balValEl, cur - amount, cur);
    }
    this.toast('[预览] 播放到账动画', 'success');
  },

  confirmClearAll() {
    this.openConfirm('⚠️ 确定清空所有数据？此操作不可恢复！', () => {
      Store.clearAll(); this.toast('已清空', 'success');
      this.state.selectedMemberId = null; this.renderAll();
    });
  },

  // ==================== 弹窗控制 ====================

  openModal() { document.getElementById('modalOverlay').classList.add('show'); },
  closeModal() { document.getElementById('modalOverlay').classList.remove('show'); this.state.editingId = null; this.state.editingType = null; },

  openConfirm(msg, cb) {
    document.getElementById('confirmMessage').textContent = msg;
    document.getElementById('confirmOverlay').classList.add('show');
    const ok = document.getElementById('confirmOk');
    const n = ok.cloneNode(true);
    ok.parentNode.replaceChild(n, ok);
    n.addEventListener('click', () => { this.closeConfirm(); cb(); });
  },
  closeConfirm() { document.getElementById('confirmOverlay').classList.remove('show'); },

  // ==================== Toast ====================

  toast(msg, type = '') {
    const el = document.getElementById('toast');
    el.textContent = msg; el.className = 'toast show ' + type;
    clearTimeout(this._tt);
    this._tt = setTimeout(() => { el.className = 'toast ' + type; }, 2000);
  },

  showAmountPopup(text) {
    const popup = document.createElement('div');
    popup.className = 'amount-popup';
    popup.textContent = text;
    popup.style.left = '50%'; popup.style.top = '40%';
    popup.style.transform = 'translateX(-50%)';
    popup.style.color = text.startsWith('-') ? 'var(--penalty)' : 'var(--earn)';
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 1000);
  },

  // ==================== 工具 ====================

  escape(text) {
    if (!text) return '';
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
  },

  formatDateLabel(dateStr) {
    const t = Store._todayStr();
    if (dateStr === t) return '今天';
    const d = new Date(); d.setDate(d.getDate() - 1);
    const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), day = String(d.getDate()).padStart(2,'0');
    if (dateStr === `${y}-${m}-${day}`) return '昨天';
    const [yy, mm, dd] = dateStr.split('-');
    return `${parseInt(mm)}月${parseInt(dd)}日`;
  },

  showConfetti() {
    const colors = ['#FF9A8B','#FFBFB6','#8FCACA','#A855F7','#FFD93D','#6BCB77','#FF6B6B','#4ECDC4','#F7DC6F','#FF8A65'];
    const count = 130;
    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'confetti';
      const color = colors[Math.floor(Math.random() * colors.length)];
      // 扇形喷洒：从底部中心向上以大扇形喷出（超出屏幕自然裁切）
      const fanAngle = (Math.random() - 0.5) * 160; // -80° ~ +80° 大扇形
      const rad = fanAngle * Math.PI / 180;
      const spread = Math.sin(rad);
      const peakX = (spread * (40 + Math.random() * 350)).toFixed(0) + 'px'; // 到顶点时的水平位置
      const peakY = (-(70 + Math.random() * 25)).toFixed(0) + 'vh'; // 顶点高度 70~95vh
      const fallX = (spread * (80 + Math.random() * 500)).toFixed(0) + 'px'; // 坠落时大幅度水平散开
      const fallY = (15 + Math.random() * 50).toFixed(0) + 'vh'; // 最终散落到起始点下方
      const delay = Math.random() * 0.15;
      const duration = 2.8 + Math.random() * 1.5;
      const size = 5 + Math.random() * 8;
      const rotation = (Math.random() - 0.5) * 1440;
      const isCircle = Math.random() > 0.5;

      particle.style.cssText = `
        left:50%; bottom:0;
        margin-left:-${size/2}px;
        width:${size}px; height:${isCircle ? size : size*0.6}px;
        background:${color};
        border-radius:${isCircle ? '50%' : '2px'};
        animation: confettiBurst ${duration}s cubic-bezier(0.22, 0.1, 0.35, 1) ${delay}s both;
        --peakX:${peakX}; --peakY:${peakY};
        --fallX:${fallX}; --fallY:${fallY};
        --spin:${rotation}deg;
      `;
      container.appendChild(particle);
    }

    setTimeout(() => container.remove(), 4800);
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
