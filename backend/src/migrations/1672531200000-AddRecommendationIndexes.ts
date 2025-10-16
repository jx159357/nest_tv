import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRecommendationIndexes1672531200000 implements MigrationInterface {
  name = 'AddRecommendationIndexes1672531200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 推荐表索引优化
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_RECOMMENDATION_USER_TYPE_ACTIVE 
      ON recommendation (user_id, type, is_active);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_RECOMMENDATION_EXPIRES_AT 
      ON recommendation (expires_at);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_RECOMMENDATION_SCORE_PRIORITY 
      ON recommendation (score DESC, priority ASC);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_RECOMMENDATION_MEDIA_RESOURCE 
      ON recommendation (media_resource_id);
    `);

    // 观看历史表索引优化
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_WATCH_HISTORY_USER_MEDIA 
      ON watch_history (user_id, media_resource_id);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_WATCH_HISTORY_USER_WATCHED_AT 
      ON watch_history (user_id, watched_at DESC);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_WATCH_HISTORY_MEDIA_USER 
      ON watch_history (media_resource_id, user_id);
    `);

    // 媒体资源表索引优化
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_MEDIA_TYPE_RATING_ACTIVE 
      ON media_resource (type, rating DESC, is_active);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_MEDIA_VIEW_COUNT_RATING 
      ON media_resource (view_count DESC, rating DESC);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_MEDIA_CREATED_AT_ACTIVE 
      ON media_resource (created_at DESC, is_active);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_MEDIA_QUALITY_RATING 
      ON media_resource (quality, rating DESC);
    `);

    // 用户收藏表索引优化
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_FAVORITE_USER_MEDIA 
      ON user_favorites (user_id, media_resource_id);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_FAVORITE_USER_CREATED_AT 
      ON user_favorites (user_id, created_at DESC);
    `);

    // 复合索引优化（针对协同过滤查询）
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_WATCH_HISTORY_MEDIA_COUNT 
      ON watch_history (media_resource_id, watched_at DESC) 
      INCLUDE (user_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除创建的索引
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_RECOMMENDATION_USER_TYPE_ACTIVE;`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_RECOMMENDATION_EXPIRES_AT;`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_RECOMMENDATION_SCORE_PRIORITY;`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_RECOMMENDATION_MEDIA_RESOURCE;`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_WATCH_HISTORY_USER_MEDIA;`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_WATCH_HISTORY_USER_WATCHED_AT;`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_WATCH_HISTORY_MEDIA_USER;`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_MEDIA_TYPE_RATING_ACTIVE;`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_MEDIA_VIEW_COUNT_RATING;`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_MEDIA_CREATED_AT_ACTIVE;`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_MEDIA_QUALITY_RATING;`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_FAVORITE_USER_MEDIA;`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_FAVORITE_USER_CREATED_AT;`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_WATCH_HISTORY_MEDIA_COUNT;`);
  }
}
