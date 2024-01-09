<script setup lang="ts">
const props = defineProps({
  matrix: {
    type: Array<Array<number>>,
    required: true
  },
  title: {
    type: String,
    required: true
  }
});

const rows = 8;
const columns = 8;
</script>

<template>
  <table class="table">
    <caption>
      {{
        props.title
      }}
    </caption>
    <tbody>
      <tr v-for="(row, rowIndex) in rows" :key="rowIndex">
        <td v-for="(column, columnIndex) in columns" :key="columnIndex">
          {{ props.matrix[rowIndex][columnIndex].toFixed(2) }}
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
.table {
  border: 1px solid var(--color-text);
  color: var(--vt-c-text-dark-1);
}

.table td {
  border: 1px solid var(--color-text);
  width: 30px;
  height: 30px;
  text-align: center;
  vertical-align: middle;
}
</style>
