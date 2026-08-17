/**
 * 数据存储层 - Store Layer
 *
 * 当前实现：localStorage 本地存储
 * 后续可替换为：云端 API（Supabase / Firebase / 自建后端）
 *
 * 只需保持相同的接口方法，替换内部实现即可无缝切换。
 *
 * v2.0 更新：
 * - 支持「赚钱任务」和「扣款任务」（金额可为负数）
 * - 支持「基础零花钱 / 必完成项」
 * - 金额单位统一为「元」
 */

const Store = {
  // 存储键名
  KEYS: {
    MEMBERS: 'hw2_members',
    TASKS: 'hw2_tasks',
    BASIC_TASKS: 'hw2_basic_tasks',
    RECORDS: 'hw2_records',
    REWARDS: 'hw2_rewards',
    REDEMPTIONS: 'hw2_redemptions',
    WISHES: 'hw2_wishes',
    WISH_ACHIEVEMENTS: 'hw2_wish_achievements',
    SETTINGS: 'hw2_settings',
    STREAKS: 'hw2_streaks',
    ACHIEVEMENTS: 'hw2_achievements',
  },

  // ==================== 基础工具 ====================

  _read(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('读取数据失败:', key, e);
      return [];
    }
  },

  _write(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('写入数据失败:', key, e);
      return false;
    }
  },

  _uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  },

  _nowISO() {
    return new Date().toISOString();
  },

  _todayStr() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },

  _weekStr(date = new Date()) {
    // 计算 ISO 周数：YYYY-WNN
    const target = new Date(date.valueOf());
    const dayNr = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    const weekNr = 1 + Math.ceil((firstThursday - target) / 604800000);
    return `${date.getFullYear()}-W${String(weekNr).padStart(2, '0')}`;
  },

  // ==================== 设置 ====================

  getSettings() {
    const raw = localStorage.getItem(this.KEYS.SETTINGS);
    const defaults = {
      weeklyBaseAmount: 10, // 每周基础零花钱（元）
      payday: 'sunday',     // 发薪日
    };
    try {
      const parsed = raw ? JSON.parse(raw) : {};
      return { ...defaults, ...parsed };
    } catch (e) {
      return defaults;
    }
  },

  updateSettings(updates) {
    const settings = { ...this.getSettings(), ...updates };
    localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
    return settings;
  },

  // ==================== 成员管理 ====================

  getMembers() {
    return this._read(this.KEYS.MEMBERS);
  },

  getMember(id) {
    return this.getMembers().find(m => m.id === id) || null;
  },

  addMember({ name, avatar, color }) {
    const members = this.getMembers();
    const member = {
      id: this._uid(),
      name: name.trim(),
      avatar: avatar || '👤',
      color: color || this._pickColor(members.length),
      createdAt: this._nowISO(),
    };
    members.push(member);
    this._write(this.KEYS.MEMBERS, members);
    return member;
  },

  updateMember(id, updates) {
    const members = this.getMembers();
    const idx = members.findIndex(m => m.id === id);
    if (idx === -1) return null;
    members[idx] = { ...members[idx], ...updates };
    this._write(this.KEYS.MEMBERS, members);
    return members[idx];
  },

  deleteMember(id) {
    const members = this.getMembers().filter(m => m.id !== id);
    const records = this.getRecords().filter(r => r.memberId !== id);
    const redemptions = this.getRedemptions().filter(r => r.memberId !== id);
    this._write(this.KEYS.MEMBERS, members);
    this._write(this.KEYS.RECORDS, records);
    this._write(this.KEYS.REDEMPTIONS, redemptions);
    return true;
  },

  _pickColor(index) {
    const colors = [
      '#FF8B94', '#6CC3D5', '#F7DC6F', '#82E0AA',
      '#BB8FCE', '#F1948A', '#85C1E9', '#F8C471',
    ];
    return colors[index % colors.length];
  },

  // ==================== 家务任务（赚钱/扣款） ====================

  getTasks() {
    return this._read(this.KEYS.TASKS);
  },

  getTask(id) {
    return this.getTasks().find(t => t.id === id) || null;
  },

  addTask({ name, icon, amount, type = 'earn' }) {
    const tasks = this.getTasks();
    const task = {
      id: this._uid(),
      name: name.trim(),
      icon: icon || (type === 'penalty' ? '⚠️' : '🧹'),
      amount: parseFloat(amount) || 0,
      type, // 'earn' 赚钱 | 'penalty' 扣款
      createdAt: this._nowISO(),
    };
    tasks.push(task);
    this._write(this.KEYS.TASKS, tasks);
    return task;
  },

  updateTask(id, updates) {
    const tasks = this.getTasks();
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) return null;
    if (updates.amount !== undefined) {
      updates.amount = parseFloat(updates.amount) || 0;
    }
    tasks[idx] = { ...tasks[idx], ...updates };
    this._write(this.KEYS.TASKS, tasks);
    return tasks[idx];
  },

  deleteTask(id) {
    const tasks = this.getTasks().filter(t => t.id !== id);
    this._write(this.KEYS.TASKS, tasks);
    return true;
  },

  // ==================== 基础零花钱 / 必完成项 ====================

  getBasicTasks() {
    return this._read(this.KEYS.BASIC_TASKS);
  },

  getBasicTask(id) {
    return this.getBasicTasks().find(t => t.id === id) || null;
  },

  addBasicTask({ name, icon }) {
    const tasks = this.getBasicTasks();
    const task = {
      id: this._uid(),
      name: name.trim(),
      icon: icon || '✅',
      createdAt: this._nowISO(),
    };
    tasks.push(task);
    this._write(this.KEYS.BASIC_TASKS, tasks);
    return task;
  },

  updateBasicTask(id, updates) {
    const tasks = this.getBasicTasks();
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) return null;
    tasks[idx] = { ...tasks[idx], ...updates };
    this._write(this.KEYS.BASIC_TASKS, tasks);
    return tasks[idx];
  },

  deleteBasicTask(id) {
    const tasks = this.getBasicTasks().filter(t => t.id !== id);
    this._write(this.KEYS.BASIC_TASKS, tasks);
    return true;
  },

  /**
   * 标记基础任务完成（按周重置）
   */
  toggleBasicTaskThisWeek(id, memberId) {
    const tasks = this.getBasicTasks();
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) return null;

    const currentWeek = this._weekStr();
    const task = tasks[idx];

    // completedBy: { memberId: '2026-W32' }
    const completedBy = task.completedBy || {};

    if (completedBy[memberId] === currentWeek) {
      delete completedBy[memberId];
    } else {
      completedBy[memberId] = currentWeek;
    }

    task.completedBy = completedBy;
    this._write(this.KEYS.BASIC_TASKS, tasks);
    return task;
  },

  isBasicTaskCompletedThisWeek(taskId, memberId) {
    const task = this.getBasicTask(taskId);
    if (!task) return false;
    const completedBy = task.completedBy || {};
    return completedBy[memberId] === this._weekStr();
  },

  getBasicTaskProgress(memberId) {
    const tasks = this.getBasicTasks();
    if (tasks.length === 0) return { total: 0, completed: 0, allDone: false };
    const completed = tasks.filter(t => this.isBasicTaskCompletedThisWeek(t.id, memberId)).length;
    return {
      total: tasks.length,
      completed,
      allDone: completed >= tasks.length,
    };
  },

  /**
   * 领取本周基础零花钱
   */
  claimBasicAllowance(memberId) {
    const settings = this.getSettings();
    const progress = this.getBasicTaskProgress(memberId);
    if (!progress.allDone) return { error: '本周必完成项还没全部完成' };

    // 检查本周是否已领取
    const currentWeek = this._weekStr();
    const alreadyClaimed = this.getRecords().some(r =>
      r.memberId === memberId &&
      r.recordType === 'basic' &&
      r.week === currentWeek
    );
    if (alreadyClaimed) return { error: '本周基础零花钱已领取' };

    const records = this.getRecords();
    const record = {
      id: this._uid(),
      memberId,
      taskId: 'basic',
      taskName: '本周基础零花钱',
      taskIcon: '💵',
      amount: settings.weeklyBaseAmount,
      recordType: 'basic',
      week: currentWeek,
      date: this._todayStr(),
      timestamp: Date.now(),
      note: '完成本周必完成项奖励',
    };
    records.push(record);
    this._write(this.KEYS.RECORDS, records);
    // 更新连续打卡
    this._updateStreak(memberId);
    return record;
  },

  // ==================== 收支记录 ====================

  getRecords() {
    return this._read(this.KEYS.RECORDS);
  },

  getRecordsByMember(memberId) {
    return this.getRecords().filter(r => r.memberId === memberId);
  },

  getRecordsByDate(dateStr) {
    return this.getRecords().filter(r => r.date === dateStr);
  },

  getRecordsByDateRange(startDate, endDate) {
    return this.getRecords().filter(r => r.date >= startDate && r.date <= endDate);
  },

  addRecord({ memberId, taskId, note }) {
    const records = this.getRecords();
    const task = this.getTask(taskId);
    const record = {
      id: this._uid(),
      memberId,
      taskId,
      taskName: task ? task.name : '未知任务',
      taskIcon: task ? task.icon : '❓',
      amount: task ? task.amount : 0,
      recordType: task ? task.type : 'earn',
      date: this._todayStr(),
      timestamp: Date.now(),
      note: (note || '').trim(),
    };
    records.push(record);
    this._write(this.KEYS.RECORDS, records);
    // 更新连续打卡
    this._updateStreak(memberId);
    return record;
  },

  deleteRecord(id) {
    const records = this.getRecords().filter(r => r.id !== id);
    this._write(this.KEYS.RECORDS, records);
    return true;
  },

  // ==================== 奖励管理 ====================

  getRewards() {
    return this._read(this.KEYS.REWARDS);
  },

  getReward(id) {
    return this.getRewards().find(r => r.id === id) || null;
  },

  addReward({ name, icon, amount, description }) {
    const rewards = this.getRewards();
    const reward = {
      id: this._uid(),
      name: name.trim(),
      icon: icon || '🎁',
      amount: Math.max(0, parseFloat(amount) || 0),
      description: (description || '').trim(),
      createdAt: this._nowISO(),
    };
    rewards.push(reward);
    this._write(this.KEYS.REWARDS, rewards);
    return reward;
  },

  updateReward(id, updates) {
    const rewards = this.getRewards();
    const idx = rewards.findIndex(r => r.id === id);
    if (idx === -1) return null;
    if (updates.amount !== undefined) {
      updates.amount = Math.max(0, parseFloat(updates.amount) || 0);
    }
    rewards[idx] = { ...rewards[idx], ...updates };
    this._write(this.KEYS.REWARDS, rewards);
    return rewards[idx];
  },

  deleteReward(id) {
    const rewards = this.getRewards().filter(r => r.id !== id);
    this._write(this.KEYS.REWARDS, rewards);
    return true;
  },

  // ==================== 奖励兑换 ====================

  getRedemptions() {
    return this._read(this.KEYS.REDEMPTIONS);
  },

  getRedemptionsByMember(memberId) {
    return this.getRedemptions().filter(r => r.memberId === memberId);
  },

  addRedemption({ memberId, rewardId }) {
    const reward = this.getReward(rewardId);
    if (!reward) return null;

    const available = this.getMemberBalance(memberId);
    if (available < reward.amount) return { error: '余额不足' };

    const redemptions = this.getRedemptions();
    const redemption = {
      id: this._uid(),
      memberId,
      rewardId,
      rewardName: reward.name,
      rewardIcon: reward.icon,
      amount: reward.amount,
      date: this._todayStr(),
      timestamp: Date.now(),
    };
    redemptions.push(redemption);
    this._write(this.KEYS.REDEMPTIONS, redemptions);
    return redemption;
  },

  deleteRedemption(id) {
    const redemptions = this.getRedemptions().filter(r => r.id !== id);
    this._write(this.KEYS.REDEMPTIONS, redemptions);
    return true;
  },

  // ==================== 心愿管理 ====================

  getWishes() {
    return this._read(this.KEYS.WISHES);
  },

  getWish(id) {
    return this.getWishes().find(w => w.id === id) || null;
  },

  addWish({ name, icon, targetAmount, description }) {
    const wishes = this.getWishes();
    const wish = {
      id: this._uid(),
      name: name.trim(),
      icon: icon || '🌟',
      targetAmount: Math.max(0.1, parseFloat(targetAmount) || 1),
      description: (description || '').trim(),
      createdAt: this._nowISO(),
    };
    wishes.push(wish);
    this._write(this.KEYS.WISHES, wishes);
    return wish;
  },

  updateWish(id, updates) {
    const wishes = this.getWishes();
    const idx = wishes.findIndex(w => w.id === id);
    if (idx === -1) return null;
    if (updates.targetAmount !== undefined) {
      updates.targetAmount = Math.max(0.1, parseFloat(updates.targetAmount) || 1);
    }
    wishes[idx] = { ...wishes[idx], ...updates };
    this._write(this.KEYS.WISHES, wishes);
    return wishes[idx];
  },

  deleteWish(id) {
    const wishes = this.getWishes().filter(w => w.id !== id);
    this._write(this.KEYS.WISHES, wishes);
    // Also delete achievements for this wish
    const achievements = this.getWishAchievements().filter(a => a.wishId !== id);
    this._write(this.KEYS.WISH_ACHIEVEMENTS, achievements);
    return true;
  },

  // ==================== 心愿达成（兑换） ====================

  getWishAchievements() {
    return this._read(this.KEYS.WISH_ACHIEVEMENTS);
  },

  getWishAchievementsByMember(memberId) {
    return this.getWishAchievements().filter(a => a.memberId === memberId);
  },

  achieveWish({ memberId, wishId }) {
    const wish = this.getWish(wishId);
    if (!wish) return { error: '心愿不存在' };

    const available = this.getMemberBalance(memberId);
    if (available < wish.targetAmount) return { error: '余额不足，继续努力！' };

    const achievements = this.getWishAchievements();
    const achievement = {
      id: this._uid(),
      wishId,
      memberId,
      wishName: wish.name,
      wishIcon: wish.icon,
      amount: wish.targetAmount,
      date: this._todayStr(),
      timestamp: Date.now(),
    };
    achievements.push(achievement);
    this._write(this.KEYS.WISH_ACHIEVEMENTS, achievements);
    return achievement;
  },

  deleteWishAchievement(id) {
    const achievements = this.getWishAchievements().filter(a => a.id !== id);
    this._write(this.KEYS.WISH_ACHIEVEMENTS, achievements);
    return true;
  },

  getMemberWishSpent(memberId) {
    return this.getWishAchievementsByMember(memberId).reduce((sum, a) => sum + a.amount, 0);
  },

  // ==================== 统计计算 ====================

  getMemberEarned(memberId) {
    return this.getRecordsByMember(memberId)
      .filter(r => r.amount > 0)
      .reduce((sum, r) => sum + r.amount, 0);
  },

  getMemberPenalties(memberId) {
    return this.getRecordsByMember(memberId)
      .filter(r => r.amount < 0)
      .reduce((sum, r) => sum + Math.abs(r.amount), 0);
  },

  getMemberSpent(memberId) {
    const rewardSpent = this.getRedemptionsByMember(memberId).reduce((sum, r) => sum + r.amount, 0);
    const wishSpent = this.getMemberWishSpent(memberId);
    return rewardSpent + wishSpent;
  },

  getMemberSpentByDateRange(memberId, startDate, endDate) {
    const rewardSpent = this.getRedemptionsByMember(memberId)
      .filter(r => r.date >= startDate && r.date <= endDate)
      .reduce((sum, r) => sum + r.amount, 0);
    const wishSpent = this.getWishAchievementsByMember(memberId)
      .filter(a => a.date >= startDate && a.date <= endDate)
      .reduce((sum, a) => sum + a.amount, 0);
    return rewardSpent + wishSpent;
  },

  getDailySpendingMap(startDate, endDate) {
    const map = {};
    const redemptions = this.getRedemptions().filter(r => r.date >= startDate && r.date <= endDate);
    const wishAchievements = this.getWishAchievements().filter(a => a.date >= startDate && a.date <= endDate);
    redemptions.forEach(r => { map[r.date] = (map[r.date] || 0) + r.amount; });
    wishAchievements.forEach(a => { map[a.date] = (map[a.date] || 0) + a.amount; });
    return map;
  },

  getMemberBalance(memberId) {
    const earned = this.getRecordsByMember(memberId).reduce((sum, r) => sum + r.amount, 0);
    const spent = this.getMemberSpent(memberId);
    return earned - spent;
  },

  getMemberMonthlyBalance(memberId, yearMonth) {
    const earned = this.getRecordsByMember(memberId)
      .filter(r => r.date.startsWith(yearMonth))
      .reduce((sum, r) => sum + r.amount, 0);
    const [y, m] = yearMonth.split('-').map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    const startDate = `${yearMonth}-01`;
    const endDate = `${yearMonth}-${String(lastDay).padStart(2, '0')}`;
    const spent = this.getMemberSpentByDateRange(memberId, startDate, endDate);
    return earned - spent;
  },

  getLeaderboard() {
    const members = this.getMembers();
    return members.map(m => ({
      ...m,
      earned: this.getMemberEarned(m.id),
      penalties: this.getMemberPenalties(m.id),
      spent: this.getMemberSpent(m.id),
      balance: this.getMemberBalance(m.id),
      taskCount: this.getRecordsByMember(m.id).filter(r => r.recordType !== 'basic').length,
      basicProgress: this.getBasicTaskProgress(m.id),
    })).sort((a, b) => b.balance - a.balance);
  },

  // ==================== 连续打卡 ====================

  _getStreaks() {
    return this._read(this.KEYS.STREAKS);
  },

  _getMemberStreak(memberId) {
    return this._getStreaks().find(s => s.memberId === memberId) || null;
  },

  getMemberStreak(memberId) {
    const s = this._getMemberStreak(memberId);
    if (!s) return { currentStreak: 0, bestStreak: 0, lastActiveDate: null };
    return { currentStreak: s.currentStreak, bestStreak: s.bestStreak, lastActiveDate: s.lastActiveDate };
  },

  _updateStreak(memberId) {
    const today = this._todayStr();
    const streaks = this._getStreaks();
    const idx = streaks.findIndex(s => s.memberId === memberId);
    let streak;

    if (idx >= 0) {
      streak = streaks[idx];
      const lastDate = streak.lastActiveDate;

      if (lastDate === today) {
        // 今天已经打过卡，不重复计算
        return null;
      }

      // 判断是否连续
      const last = new Date(lastDate + 'T00:00:00');
      const cur = new Date(today + 'T00:00:00');
      const diffDays = Math.round((cur - last) / 86400000);

      if (diffDays === 1) {
        streak.currentStreak += 1;
      } else {
        streak.currentStreak = 1;
      }
      streak.lastActiveDate = today;
      if (streak.currentStreak > streak.bestStreak) {
        streak.bestStreak = streak.currentStreak;
      }
      streaks[idx] = streak;
    } else {
      streak = {
        memberId,
        currentStreak: 1,
        bestStreak: 1,
        lastActiveDate: today,
      };
      streaks.push(streak);
    }

    this._write(this.KEYS.STREAKS, streaks);
    return streak;
  },

  // ==================== 成就系统 ====================

  ACHIEVEMENT_DEFS: [
    // 🔥 打卡类
    { id: 'streak_3',  category: 'streak',   name: '三日坚持',   icon: '🔥', desc: '连续打卡 3 天',       condition: (stats) => stats.bestStreak >= 3,  color: '#FF6B35' },
    { id: 'streak_7',  category: 'streak',   name: '周冠军',     icon: '👑', desc: '连续打卡 7 天',       condition: (stats) => stats.bestStreak >= 7,  color: '#E8A838' },
    { id: 'streak_30', category: 'streak',   name: '月度MVP',    icon: '🏆', desc: '连续打卡 30 天',      condition: (stats) => stats.bestStreak >= 30, color: '#D4AF37' },
    // 💰 财富类
    { id: 'wealth_50',  category: 'wealth',  name: '小有积蓄',   icon: '💰', desc: '累计收入 ¥50',        condition: (stats) => stats.totalEarned >= 50,  color: '#4ECDC4' },
    { id: 'wealth_100', category: 'wealth',  name: '理财达人',   icon: '💎', desc: '累计收入 ¥100',       condition: (stats) => stats.totalEarned >= 100, color: '#22C55E' },
    { id: 'wealth_500', category: 'wealth',  name: '小小富翁',   icon: '👑', desc: '累计收入 ¥500',       condition: (stats) => stats.totalEarned >= 500, color: '#F59E0B' },
    // 🧹 勤劳类
    { id: 'tasks_50',  category: 'diligent', name: '勤劳小蜜蜂', icon: '🐝', desc: '完成 50 个任务',      condition: (stats) => stats.totalTasks >= 50,   color: '#8FCACA' },
    { id: 'tasks_100', category: 'diligent', name: '家务达人',   icon: '🌟', desc: '完成 100 个任务',     condition: (stats) => stats.totalTasks >= 100,  color: '#A855F7' },
    // ⭐ 里程碑类
    { id: 'first_task',   category: 'milestone', name: '初次打卡',   icon: '🎉', desc: '完成第一个任务',     condition: (stats) => stats.totalTasks >= 1,    color: '#FF9A8B' },
    { id: 'first_redeem', category: 'milestone', name: '首次兑换',   icon: '🎁', desc: '兑换第一个奖励',     condition: (stats) => stats.redemptionCount >= 1, color: '#FFD93D' },
    { id: 'first_wish',   category: 'milestone', name: '梦想成真',   icon: '🌟', desc: '达成第一个心愿',     condition: (stats) => stats.wishCount >= 1,     color: '#C084FC' },
    { id: 'full_week',    category: 'milestone', name: '全勤星期',   icon: '📅', desc: '一周内完成全部基础任务', condition: (stats) => stats.weekFullDone,      color: '#6BCB77' },
  ],

  _getAchievements() {
    return this._read(this.KEYS.ACHIEVEMENTS);
  },

  getMemberAchievements(memberId) {
    return this._getAchievements().filter(a => a.memberId === memberId);
  },

  getMemberStats(memberId) {
    const records = this.getRecordsByMember(memberId);
    const streak = this.getMemberStreak(memberId);
    const redeems = this.getRedemptionsByMember(memberId);
    const wishAchievements = this.getWishAchievementsByMember(memberId);

    // 全勤检查：本周该成员的基础任务是否全部完成
    const basicTasks = this.getBasicTasks();
    const weekFullDone = basicTasks.length > 0 && this.getBasicTaskProgress(memberId).allDone;

    return {
      totalEarned: records.filter(r => r.amount > 0).reduce((sum, r) => sum + r.amount, 0),
      totalTasks: records.filter(r => r.recordType !== 'basic').length,
      bestStreak: streak.bestStreak,
      currentStreak: streak.currentStreak,
      redemptionCount: redeems.length,
      wishCount: wishAchievements.length > 0 ? 1 : 0,
      weekFullDone,
    };
  },

  checkAchievements(memberId) {
    const allAchievements = this._getAchievements();
    const unlockedIds = new Set(
      allAchievements.filter(a => a.memberId === memberId).map(a => a.achievementId)
    );
    const stats = this.getMemberStats(memberId);
    const newlyUnlocked = [];

    this.ACHIEVEMENT_DEFS.forEach(def => {
      if (unlockedIds.has(def.id)) return; // 已解锁，跳过
      try {
        if (def.condition(stats)) {
          const achievement = {
            achievementId: def.id,
            memberId,
            unlockedAt: Date.now(),
          };
          allAchievements.push(achievement);
          newlyUnlocked.push({ ...def, ...achievement });
        }
      } catch (e) {
        console.error('成就检查失败:', def.id, e);
      }
    });

    if (newlyUnlocked.length > 0) {
      this._write(this.KEYS.ACHIEVEMENTS, allAchievements);
    }

    return newlyUnlocked;
  },

  getAllAchievements(memberId) {
    const unlocked = this.getMemberAchievements(memberId);
    const unlockedIds = new Set(unlocked.map(a => a.achievementId));
    return this.ACHIEVEMENT_DEFS.map(def => ({
      ...def,
      unlocked: unlockedIds.has(def.id),
      unlockedAt: unlockedIds.has(def.id) ? unlocked.find(a => a.achievementId === def.id).unlockedAt : null,
    }));
  },

  getTodayStats() {
    const today = this._todayStr();
    const todayRecords = this.getRecordsByDate(today);
    const members = this.getMembers();
    return members.map(m => {
      const myRecords = todayRecords.filter(r => r.memberId === m.id);
      return {
        ...m,
        todayEarned: myRecords.filter(r => r.amount > 0).reduce((sum, r) => sum + r.amount, 0),
        todayPenalty: myRecords.filter(r => r.amount < 0).reduce((sum, r) => sum + Math.abs(r.amount), 0),
        todayTasks: myRecords.filter(r => r.recordType !== 'basic').length,
      };
    });
  },

  getMonthStats(offset = 0) {
    const now = new Date();
    now.setMonth(now.getMonth() + offset);
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const members = this.getMembers();
    const tasks = this.getTasks();

    const taskStats = tasks.map(t => {
      const records = this.getRecords().filter(r => r.taskId === t.id && r.date.startsWith(yearMonth));
      return {
        ...t,
        count: records.length,
        totalAmount: records.reduce((sum, r) => sum + r.amount, 0),
      };
    }).sort((a, b) => b.count - a.count);

    const memberStats = members.map(m => {
      const mRecords = this.getRecordsByMember(m.id).filter(r => r.date.startsWith(yearMonth));
      const monthSpent = this.getMemberSpentByDateRange(m.id, `${yearMonth}-01`,
        `${yearMonth}-${String(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).padStart(2, '0')}`);
      return {
        ...m,
        earned: mRecords.filter(r => r.amount > 0).reduce((sum, r) => sum + r.amount, 0),
        penalty: mRecords.filter(r => r.amount < 0).reduce((sum, r) => sum + Math.abs(r.amount), 0),
        spent: monthSpent,
        balance: mRecords.reduce((sum, r) => sum + r.amount, 0) - monthSpent,
      };
    }).sort((a, b) => b.balance - a.balance);

    return {
      yearMonth,
      label: `${now.getFullYear()}年${now.getMonth() + 1}月`,
      taskStats,
      memberStats,
      totalEarned: memberStats.reduce((sum, m) => sum + m.earned, 0),
      totalPenalty: memberStats.reduce((sum, m) => sum + m.penalty, 0),
      totalSpent: memberStats.reduce((sum, m) => sum + m.spent, 0),
      totalTasks: taskStats.reduce((sum, t) => sum + t.count, 0),
      netIncome: memberStats.reduce((sum, m) => sum + m.balance, 0),
    };
  },

  getWeekStats(offset = 0) {
    const now = new Date();
    now.setDate(now.getDate() + offset * 7);
    const dayOfWeek = now.getDay();
    const mondayDiff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayDiff);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const startStr = this._dateStr(monday);
    const endStr = this._dateStr(sunday);
    const members = this.getMembers();
    const tasks = this.getTasks();
    const records = this.getRecords().filter(r => r.date >= startStr && r.date <= endStr);

    const taskStats = tasks.map(t => {
      const tRecords = records.filter(r => r.taskId === t.id);
      return { ...t, count: tRecords.length, totalAmount: tRecords.reduce((sum, r) => sum + r.amount, 0) };
    }).sort((a, b) => b.count - a.count);

    const memberStats = members.map(m => {
      const mRecords = records.filter(r => r.memberId === m.id);
      const weekSpent = this.getMemberSpentByDateRange(m.id, startStr, endStr);
      return {
        ...m,
        earned: mRecords.filter(r => r.amount > 0).reduce((sum, r) => sum + r.amount, 0),
        penalty: mRecords.filter(r => r.amount < 0).reduce((sum, r) => sum + Math.abs(r.amount), 0),
        spent: weekSpent,
        balance: mRecords.reduce((sum, r) => sum + r.amount, 0) - weekSpent,
      };
    }).sort((a, b) => b.balance - a.balance);

    return {
      startStr, endStr,
      label: `${monday.getMonth() + 1}/${monday.getDate()} - ${sunday.getMonth() + 1}/${sunday.getDate()}`,
      taskStats, memberStats,
      totalEarned: memberStats.reduce((sum, m) => sum + m.earned, 0),
      totalPenalty: memberStats.reduce((sum, m) => sum + m.penalty, 0),
      totalSpent: memberStats.reduce((sum, m) => sum + m.spent, 0),
      totalTasks: taskStats.reduce((sum, t) => sum + t.count, 0),
      netIncome: memberStats.reduce((sum, m) => sum + m.balance, 0),
    };
  },

  getYearStats(offset = 0) {
    const now = new Date();
    const year = now.getFullYear() + offset;
    const members = this.getMembers();
    const tasks = this.getTasks();
    const prefix = `${year}-`;

    const taskStats = tasks.map(t => {
      const records = this.getRecords().filter(r => r.taskId === t.id && r.date.startsWith(prefix));
      return { ...t, count: records.length, totalAmount: records.reduce((sum, r) => sum + r.amount, 0) };
    }).sort((a, b) => b.count - a.count);

    const memberStats = members.map(m => {
      const mRecords = this.getRecordsByMember(m.id).filter(r => r.date.startsWith(prefix));
      const yearSpent = this.getMemberSpentByDateRange(m.id, `${year}-01-01`, `${year}-12-31`);
      return {
        ...m,
        earned: mRecords.filter(r => r.amount > 0).reduce((sum, r) => sum + r.amount, 0),
        penalty: mRecords.filter(r => r.amount < 0).reduce((sum, r) => sum + Math.abs(r.amount), 0),
        spent: yearSpent,
        balance: mRecords.reduce((sum, r) => sum + r.amount, 0) - yearSpent,
        monthlyBreakdown: this._getMonthlyBreakdown(m.id, year),
      };
    }).sort((a, b) => b.balance - a.balance);

    return {
      year,
      label: `${year}年`,
      taskStats, memberStats,
      totalEarned: memberStats.reduce((sum, m) => sum + m.earned, 0),
      totalPenalty: memberStats.reduce((sum, m) => sum + m.penalty, 0),
      totalSpent: memberStats.reduce((sum, m) => sum + m.spent, 0),
      totalTasks: taskStats.reduce((sum, t) => sum + t.count, 0),
      netIncome: memberStats.reduce((sum, m) => sum + m.balance, 0),
    };
  },

  _getMonthlyBreakdown(memberId, year) {
    const months = [];
    for (let m = 1; m <= 12; m++) {
      const prefix = `${year}-${String(m).padStart(2, '0')}`;
      const earned = this.getRecordsByMember(memberId)
        .filter(r => r.date.startsWith(prefix))
        .reduce((sum, r) => sum + r.amount, 0);
      const lastDay = new Date(year, m, 0).getDate();
      const startDate = `${prefix}-01`;
      const endDate = `${prefix}-${String(lastDay).padStart(2, '0')}`;
      const spent = this.getMemberSpentByDateRange(memberId, startDate, endDate);
      months.push({ month: m, balance: earned - spent });
    }
    return months;
  },

  _dateStr(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  getMonthlyStats() {
    return this.getMonthStats(0);
  },

  // ==================== 数据导入导出 ====================

  exportAll() {
    return {
      version: '2.0',
      exportedAt: this._nowISO(),
      data: {
        members: this.getMembers(),
        tasks: this.getTasks(),
        basicTasks: this.getBasicTasks(),
        records: this.getRecords(),
        rewards: this.getRewards(),
        redemptions: this.getRedemptions(),
        wishes: this.getWishes(),
        wishAchievements: this.getWishAchievements(),
        settings: this.getSettings(),
        streaks: this._getStreaks(),
        achievements: this._getAchievements(),
      },
    };
  },

  importAll(jsonData) {
    try {
      const parsed = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      const data = parsed.data || parsed;
      if (data.members) this._write(this.KEYS.MEMBERS, data.members);
      if (data.tasks) this._write(this.KEYS.TASKS, data.tasks);
      if (data.basicTasks) this._write(this.KEYS.BASIC_TASKS, data.basicTasks);
      if (data.records) this._write(this.KEYS.RECORDS, data.records);
      if (data.rewards) this._write(this.KEYS.REWARDS, data.rewards);
      if (data.redemptions) this._write(this.KEYS.REDEMPTIONS, data.redemptions);
      if (data.wishes) this._write(this.KEYS.WISHES, data.wishes);
      if (data.wishAchievements) this._write(this.KEYS.WISH_ACHIEVEMENTS, data.wishAchievements);
      if (data.settings) localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(data.settings));
      if (data.streaks) this._write(this.KEYS.STREAKS, data.streaks);
      if (data.achievements) this._write(this.KEYS.ACHIEVEMENTS, data.achievements);
      return true;
    } catch (e) {
      console.error('导入数据失败:', e);
      return false;
    }
  },

  clearAll() {
    Object.values(this.KEYS).forEach(key => localStorage.removeItem(key));
  },

  isEmpty() {
    return this.getMembers().length === 0 && this.getTasks().length === 0 && this.getBasicTasks().length === 0;
  },

  initSampleData() {
    if (!this.isEmpty()) return;

    const kid = this.addMember({ name: '宝贝', avatar: '🧒', color: '#FF8B94' });
    const dad = this.addMember({ name: '爸爸', avatar: '👨', color: '#6CC3D5' });
    const mom = this.addMember({ name: '妈妈', avatar: '👩', color: '#F7DC6F' });

    // 基础零花钱 / 必完成项
    this.addBasicTask({ name: '7:00起床 22:30前睡觉', icon: '🌙' });
    this.addBasicTask({ name: '整理自己地盘', icon: '🧸' });
    this.addBasicTask({ name: '手洗袜子/内裤', icon: '🧦' });
    this.addBasicTask({ name: '饭前摆桌 饭后收碗', icon: '🍽️' });
    this.addBasicTask({ name: '按时刷牙洗脸', icon: '🪥' });

    // 赚钱家务（来自参考图）
    this.addTask({ name: '倒垃圾', icon: '🗑️', amount: 1 });
    this.addTask({ name: '擦桌子', icon: '🧽', amount: 1 });
    this.addTask({ name: '洗碗', icon: '🍽️', amount: 2 });
    this.addTask({ name: '帮厨', icon: '🥬', amount: 1.5 });
    this.addTask({ name: '套垃圾袋/清下水', icon: '🚰', amount: 0.5 });
    this.addTask({ name: '叠/收衣物', icon: '👕', amount: 0.1 });
    this.addTask({ name: '整理沙发', icon: '🛋️', amount: 0.5 });
    this.addTask({ name: '洗鞋（小孩）', icon: '👟', amount: 2.5 });
    this.addTask({ name: '洗鞋（大人）', icon: '👟', amount: 5 });
    this.addTask({ name: '扫地', icon: '🧹', amount: 1.5 });
    this.addTask({ name: '铺床', icon: '🛏️', amount: 2 });
    this.addTask({ name: '浇花', icon: '🌿', amount: 0.5 });
    this.addTask({ name: '铲屎', icon: '🐱', amount: 5 });
    this.addTask({ name: '喂猫', icon: '🐟', amount: 1.5 });
    this.addTask({ name: '自主打卡', icon: '✅', amount: 1 });

    // 扣款项目（来自参考图）
    this.addTask({ name: '说脏话/不礼貌', icon: '🤐', amount: -2, type: 'penalty' });
    this.addTask({ name: '尿出马桶', icon: '🚽', amount: -1.5, type: 'penalty' });
    this.addTask({ name: '作业不认真', icon: '✏️', amount: -2, type: 'penalty' });
    this.addTask({ name: '乱发脾气', icon: '😤', amount: -1.5, type: 'penalty' });
    this.addTask({ name: '玩具/衣物乱丢', icon: '🧸', amount: -2, type: 'penalty' });
    this.addTask({ name: '迟到（磨蹭）', icon: '⏰', amount: -3, type: 'penalty' });
    this.addTask({ name: '无故打猫', icon: '🙀', amount: -2.5, type: 'penalty' });
    this.addTask({ name: '多次呼唤不回应', icon: '📢', amount: -1, type: 'penalty' });

    // 奖励商店
    this.addReward({ name: '看动画片半小时', icon: '📺', amount: 5, description: '5元/半小时，按半小时累加' });
    this.addReward({ name: '买冷饮零食', icon: '🍦', amount: 5, description: '5元/份，先动零食加扣1元' });
    this.addReward({ name: '选购新玩具绘本', icon: '🧸', amount: 10, description: '按实际价格结算，自己支付更珍惜' });
    this.addReward({ name: '游戏时间1小时', icon: '🎮', amount: 10, description: '玩游戏或看动画1小时' });

    // 心愿
    this.addWish({ name: '去游乐园玩', icon: '🎡', targetAmount: 100, description: '全家一起去游乐园' });
  },
};

window.Store = Store;
