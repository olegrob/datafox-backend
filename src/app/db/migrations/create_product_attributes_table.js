exports.up = function(knex) {
  return knex.schema.createTable('product_attributes', function(table) {
    table.increments('id').primary();
    table.string('original_name').notNullable().unique();
    table.string('ee_translation');
    table.string('en_translation');
    table.string('ru_translation');
    table.string('attribute_type').defaultTo('text'); // text, number, boolean, etc.
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('product_attributes');
}; 