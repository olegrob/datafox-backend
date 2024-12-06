exports.up = function(knex) {
  return knex.schema.createTable('product_manufacturers', function(table) {
    table.increments('id').primary();
    table.string('original_manufacturer').notNullable();
    table.string('warehouse').notNullable();
    table.string('mapped_manufacturer');
    table.timestamps(true, true);
    table.unique(['original_manufacturer', 'warehouse']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('product_manufacturers');
}; 