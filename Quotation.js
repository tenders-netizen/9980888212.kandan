// Quotation Management JavaScript

// Data structures
let quotations = JSON.parse(localStorage.getItem('quotations') || '[]');
let searchTimeout;

// Initialize DataTable
$(document).ready(function() {
    $('#quotationsTable').DataTable();
    initializeEventListeners();
    updateQuotationsTable();
    
});

// Company Search Functionality
const companySearchInput = document.getElementById('companySearchInput');
const companySearchResults = document.getElementById('companySearchResults');
const autoCompanySearch = document.getElementById('autoCompanySearch');
const autoCompanySearchResults = document.getElementById('autoCompanySearchResults');

companySearchInput.addEventListener('input', (e) => {
  const query = e.target.value.trim();
  
  if (query.length < 2) {
    companySearchResults.classList.add('d-none');
    return;
  }

  try {
    displaySearchResults(query);
  } catch (error) {
    console.error('Error searching companies:', error);
  }
});

function displaySearchResults(query, isAuto = false) {
  const resultsContainer = isAuto ? autoCompanySearchResults : companySearchResults;
  resultsContainer.innerHTML = '';
  resultsContainer.classList.remove('d-none');

  const companies = companyManager.companies.filter(company => 
    company.name.toLowerCase().includes(query.toLowerCase()) ||
    company.phone.includes(query)
  );

  if (companies.length === 0) {
    resultsContainer.innerHTML = `
      <div class="list-group-item">
        <div class="d-flex justify-content-between align-items-center">
          <span>No companies found</span>
          <button class="btn btn-primary btn-sm" onclick="showAddPartyModal()">Add Party</button>
        </div>
      </div>
    `;
    return;
  }

  companies.forEach(company => {
    const item = document.createElement('div');
    item.className = 'list-group-item list-group-item-action';
    item.innerHTML = `
      <div class="d-flex justify-content-between">
        <h6 class="mb-1">${company.name}</h6>
        <small>${company.phone}</small>
      </div>
      <small class="text-muted">${company.email || ''}</small>
    `;
    item.addEventListener('click', () => selectCompany(company, isAuto));
    resultsContainer.appendChild(item);
  });
}

function selectCompany(company, isAuto = false) {
  const searchInput = isAuto ? autoCompanySearch : companySearchInput;
  const resultsContainer = isAuto ? autoCompanySearchResults : companySearchResults;
  const billingNameInput = isAuto ? 
    document.querySelector('input[name="autoBillingName"]') : 
    document.querySelector('input[name="billingName"]');

  searchInput.value = company.name;
  billingNameInput.value = company.name;
  resultsContainer.classList.add('d-none');
}

// Quotation Item Calculations
function calculateAmount(row) {
  const qty = parseFloat(row.querySelector('input[name="qty[]"]').value) || 0;
  const price = parseFloat(row.querySelector('input[name="price[]"]').value) || 0;
  const discount = parseFloat(row.querySelector('input[name="discount[]"]').value) || 0;
  const tax = parseFloat(row.querySelector('select[name="tax[]"]').value) || 0;

  const subtotal = qty * price;
  const discountAmount = subtotal * (discount / 100);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * (tax / 100);
  const total = afterDiscount + taxAmount;

  row.querySelector('input[name="amount[]"]').value = total.toFixed(2);
  updateTotalAmount();
}

function updateTotalAmount() {
  const amounts = Array.from(document.querySelectorAll('input[name="amount[]"]'))
    .map(input => parseFloat(input.value) || 0);
  const total = amounts.reduce((sum, amount) => sum + amount, 0);
  document.getElementById('totalAmount').textContent = total.toFixed(2);
}

// Add New Row
function addQuotationRow() {
  const tbody = document.getElementById('quotationItems');
  const newRow = tbody.querySelector('tr').cloneNode(true);
  
  // Clear input values
  newRow.querySelectorAll('input').forEach(input => input.value = '');
  newRow.querySelectorAll('select').forEach(select => select.selectedIndex = 0);
  
  // Update row number
  newRow.querySelector('td:first-child').textContent = tbody.children.length + 1;
  
  // Add event listeners
  addRowEventListeners(newRow);
  tbody.appendChild(newRow);
}

function addRowEventListeners(row) {
  const inputs = row.querySelectorAll('input[type="number"], select[name="tax[]"]');
  inputs.forEach(input => {
    input.addEventListener('input', () => calculateAmount(row));
  });

  const deleteBtn = row.querySelector('.btn-danger');
  deleteBtn.addEventListener('click', () => {
    if (document.querySelectorAll('#quotationItems tr').length > 1) {
      row.remove();
      updateRowNumbers();
      updateTotalAmount();
    }
  });
}

function updateRowNumbers() {
  const rows = document.querySelectorAll('#quotationItems tr');
  rows.forEach((row, index) => {
    row.querySelector('td:first-child').textContent = index + 1;
  });
}

// Form Submission
function submitQuotation() {
  const form = document.getElementById('quotationForm');
  const formData = new FormData(form);

  // Validation
  if (!formData.get('invoiceDate')) {
    alert('Please select a quotation date');
    return;
  }

  const items = document.querySelectorAll('#quotationItems tr');
  let isValid = true;

  items.forEach(row => {
    const item = row.querySelector('input[name="item[]"]').value;
    const qty = parseFloat(row.querySelector('input[name="qty[]"]').value);
    const price = parseFloat(row.querySelector('input[name="price[]"]').value);

    if (!item || !qty || !price) {
      isValid = false;
    }
  });

  if (!isValid) {
    alert('Please fill in all required fields for each item');
    return;
  }

  // Create quotation object
  const quotation = {
    id: Date.now(),
    quotationNumber: formData.get(isAuto ? 'autoQuotationNumber' : 'refNo'),
    date: formData.get(dateField),
    partyName: formData.get(isAuto ? 'autoBillingName' : 'billingName'),
    status: 'Pending',
    items: Array.from(items).map(row => ({
      item: row.querySelector(`input[name="${isAuto ? 'auto' : ''}item[]"]`).value,
      quantity: row.querySelector(`input[name="${isAuto ? 'auto' : ''}qty[]"]`).value,
      price: row.querySelector(`input[name="${isAuto ? 'auto' : ''}price[]"]`).value,
      amount: row.querySelector(`input[name="${isAuto ? 'auto' : ''}amount[]"]`).value
    })),
    total: parseFloat(document.getElementById(isAuto ? 'autoTotalAmount' : 'totalAmount').textContent)
  };

  // Add to quotations array, save to localStorage and update table
  quotations.push(quotation);
  localStorage.setItem('quotations', JSON.stringify(quotations));
  updateQuotationsTable();

  // Reset form and close modal
  form.reset();
  const modalId = isAuto ? '#createAutoQuotationModal' : '#createQuotationModal';
  const modal = bootstrap.Modal.getInstance(document.querySelector(modalId));
  if (modal) {
    modal.hide();
  }
  
  alert('Quotation created successfully!');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Add event listeners to initial rows
  ['#quotationItems tr', '#autoQuotationItems tr'].forEach(selector => {
    const initialRow = document.querySelector(selector);
    if (initialRow) {
      addRowEventListeners(initialRow);
    }
  });

  // Set default dates
  const today = new Date().toISOString().split('T')[0];
  document.querySelector('input[name="invoiceDate"]').value = today;
  document.querySelector('input[name="autoQuotationDate"]').value = today;

  // Initialize quotations table
  updateQuotationsTable();
});

// Update quotations table
function updateQuotationsTable() {
  const tableBody = document.getElementById('quotationsTableBody');
  tableBody.innerHTML = '';

  quotations.forEach((quotation, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${quotation.partyName}</td>
      <td>${quotation.quotationNumber}</td>
      <td>${quotation.date}</td>
      <td><span class="badge bg-${quotation.status.toLowerCase() === 'pending' ? 'warning' : 'success'}">${quotation.status}</span></td>
      <td>
        <button class="btn btn-sm btn-info" onclick="viewQuotation(${quotation.id})"><i class="fas fa-eye"></i></button>
        <button class="btn btn-sm btn-primary" onclick="editQuotation(${quotation.id})"><i class="fas fa-edit"></i></button>
        <button class="btn btn-sm btn-danger" onclick="deleteQuotation(${quotation.id})"><i class="fas fa-trash"></i></button>
      </td>
    `;
    tableBody.appendChild(row);
  });

  // Refresh DataTable
  $('#quotationsTable').DataTable().destroy();
  $('#quotationsTable').DataTable();
}

// Party Management
let companies = JSON.parse(localStorage.getItem('companies') || '[]');

function showAddPartyModal() {
  const modal = new bootstrap.Modal(document.getElementById('addPartyModal'));
  modal.show();
}

function saveParty() {
  const partyName = document.querySelector('#addPartyModal input[name="partyName"]').value;
  const gstin = document.querySelector('#addPartyModal input[name="gstin"]').value;
  const phone = document.querySelector('#addPartyModal input[name="phone"]').value;
  const email = document.querySelector('#addPartyModal input[name="email"]').value;
  const billingAddress = document.querySelector('#addPartyModal textarea[name="billingAddress"]').value;
  const shippingAddress = document.querySelector('#addPartyModal textarea[name="shippingAddress"]').value;

  if (!partyName || !phone) {
    alert('Party Name and Phone are required!');
    return;
  }

  const newParty = {
    id: Date.now(),
    name: partyName,
    gstin,
    phone,
    email,
    billingAddress,
    shippingAddress
  };

  companies.push(newParty);
  localStorage.setItem('companies', JSON.stringify(companies));

  const modal = bootstrap.Modal.getInstance(document.getElementById('addPartyModal'));
  modal.hide();

  // Clear form
  document.getElementById('addPartyForm').reset();

  // Update search results
  displaySearchResults(document.getElementById('companySearchInput').value);
}

// CRUD operations for quotations
function viewQuotation(id) {
  const quotation = quotations.find(q => q.id === id);
  // Implement view logic
  console.log('Viewing quotation:', quotation);
}

function editQuotation(id) {
  const quotation = quotations.find(q => q.id === id);
  // Implement edit logic
  console.log('Editing quotation:', quotation);
}

function deleteQuotation(id) {
  if (confirm('Are you sure you want to delete this quotation?')) {
    quotations = quotations.filter(q => q.id !== id);
    updateQuotationsTable();
  }
}