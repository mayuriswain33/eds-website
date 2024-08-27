import { fetchPlaceholders, getMetadata } from '../../scripts/aem.js';

const rowsPerPage = 20;

async function getPlaceholders() {
  const placeholders = await fetchPlaceholders(getMetadata('locale'));
  const continent = placeholders.continent || 'Continent';
  const capital = placeholders.capital || 'Capital';

  return { continent, capital };
}

async function createTableHeader(table) {
  const { continent, capital } = await getPlaceholders();

  const tr = document.createElement('tr');

  const continentHeader = document.createElement('th');
  continentHeader.appendChild(document.createTextNode(continent));

  const capitalHeader = document.createElement('th');
  capitalHeader.appendChild(document.createTextNode(capital));

  tr.append(continentHeader);
  tr.append(capitalHeader);

  table.append(tr);
}

function createTableRow(row) {
  const tr = document.createElement('tr');

  const continent = document.createElement('td');
  continent.appendChild(document.createTextNode(row.Continent || row.Region || 'N/A'));

  const capital = document.createElement('td');
  capital.appendChild(document.createTextNode(row.Capital || row.CapitalCity || 'N/A'));

  tr.append(continent);
  tr.append(capital);

  return tr;
}

async function createTable(jsonURL, offset = 1, limit = rowsPerPage) {
  const resp = await fetch(`${jsonURL}?offset=${offset}&limit=${limit}`);
  if (!resp.ok) {
    return null; // Explicitly return null if the response is not okay
  }

  const json = await resp.json();

  const table = document.createElement('table');
  await createTableHeader(table);
  json.data.forEach((row) => {
    const tableRow = createTableRow(row);
    table.appendChild(tableRow);
  });

  return { table, total: json.total };
}

async function updateTable(parentDiv, jsonURL, page, limit) {
  const offset = (page - 1) * limit + 1;

  const { table, total } = await createTable(jsonURL, offset, limit);
  parentDiv.innerHTML = '';
  if (table) {
    parentDiv.appendChild(table);
  }

  const pagination = document.createElement('div');
  pagination.classList.add('pagination-controls');

  // Pagination
  const prevButton = document.createElement('button');
  prevButton.textContent = 'Previous';
  prevButton.onclick = () => updateTable(parentDiv, jsonURL, page - 1, limit);
  prevButton.disabled = page === 1;
  pagination.appendChild(prevButton);

  const nextButton = document.createElement('button');
  nextButton.textContent = 'Next';
  nextButton.onclick = () => updateTable(parentDiv, jsonURL, page + 1, limit);
  nextButton.disabled = offset + limit - 1 >= total;
  pagination.appendChild(nextButton);

  parentDiv.appendChild(pagination);
}

export default async function decorate(block) {
  const countries = block.querySelector('a[href$=".json"]');
  const parentDiv = document.createElement('div');
  parentDiv.classList.add('countries-block');
  if (countries) {
    const currentPage = 1;
    const limit = rowsPerPage;
    await updateTable(parentDiv, countries.href, currentPage, limit);
    countries.replaceWith(parentDiv);
  }
}
