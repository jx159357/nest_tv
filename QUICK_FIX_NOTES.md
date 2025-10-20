// 修复调度器服务中的targetName问题
// 将目标对象传递而不是字符串
const targets = CRAWLER_TARGETS.filter(target => target.enabled);

for (const target of targets) {
  const result = await this.executeWithRetry(
    () => this.crawlTargetWithTimeout(target.name),
    target.name,
    requestId,
  );

  // 使用target.name而不是targetName
  this.appLogger.logOperation(
    'CRAWLER_SCHEDULE_COMPLETE',
    target.name,
    undefined,
    {
      targetName: target.name,
      // ... 其他属性
    }
  );
}