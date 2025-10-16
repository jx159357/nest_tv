"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddRecommendationIndexes1672531200000 = void 0;
class AddRecommendationIndexes1672531200000 {
    name = 'AddRecommendationIndexes1672531200000';
    async up(queryRunner) {
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
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_FAVORITE_USER_MEDIA 
      ON user_favorites (user_id, media_resource_id);
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_FAVORITE_USER_CREATED_AT 
      ON user_favorites (user_id, created_at DESC);
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_WATCH_HISTORY_MEDIA_COUNT 
      ON watch_history (media_resource_id, watched_at DESC) 
      INCLUDE (user_id);
    `);
    }
    async down(queryRunner) {
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
exports.AddRecommendationIndexes1672531200000 = AddRecommendationIndexes1672531200000;
//# sourceMappingURL=1672531200000-AddRecommendationIndexes.js.map