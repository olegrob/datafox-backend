exports.up = function(knex) {
  return knex.schema.createTable('product_warranties', function(table) {
    table.increments('id').primary();
    table.string('original_warranty').notNullable();
    table.string('warehouse').notNullable();
    table.string('eraisik_garantii');
    table.string('juriidiline_garantii');
    table.timestamps(true, true);
    table.unique(['original_warranty', 'warehouse']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('product_warranties');
}; 