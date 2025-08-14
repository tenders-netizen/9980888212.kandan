// Company Management JavaScript

class CompanyManager {
  constructor() {
    this.companies = this.loadCompanies();
    this.initializeEventListeners();
  }

  loadCompanies() {
    const savedCompanies = localStorage.getItem('companies');
    return savedCompanies ? JSON.parse(savedCompanies) : [];  
  }

  saveCompanies() {
    localStorage.setItem('companies', JSON.stringify(this.companies));
  }

  initializeEventListeners() {
    // Add Company Form Submit Handler
    const addCompanyForm = document.getElementById('addCompanyForm');
    if (addCompanyForm) {
      addCompanyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleAddCompany(e);
      });
    }

    // Company Search Event Listeners
    const searchInputs = [
      { input: 'companySearchInput', results: 'companySearchResults' },
      { input: 'autoCompanySearch', results: 'autoCompanySearchResults' }
    ];

    searchInputs.forEach(({ input, results }) => {
      const searchInput = document.getElementById(input);
      const resultsContainer = document.getElementById(results);
      
      if (searchInput && resultsContainer) {
        searchInput.addEventListener('input', (e) => {
          this.handleCompanySearch(e, resultsContainer);
        });

        // Clear button handler
        const clearBtn = searchInput.nextElementSibling;
        if (clearBtn) {
          clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            resultsContainer.classList.add('d-none');
          });
        }
      }
    });
  }

  async handleAddCompany(e) {
    try {
      const formData = new FormData(e.target);
      const companyData = {
        name: formData.get('companyName'),
        phone: formData.get('companyPhone'),
        email: formData.get('companyEmail'),
        address: formData.get('companyAddress'),
        id: Date.now()
      };

      // Validate required fields
      if (!companyData.name || !companyData.phone) {
        alert('Company name and phone are required');
        return;
      }

      // Check for duplicate company
      const isDuplicate = this.companies.some(company => 
        company.phone === companyData.phone || company.name.toLowerCase() === companyData.name.toLowerCase()
      );

      if (isDuplicate) {
        alert('A company with this name or phone number already exists');
        return;
      }

      // Add to companies array and save
      this.companies.push(companyData);
      this.saveCompanies();

      // Close modal and reset form
      const modal = bootstrap.Modal.getInstance(document.getElementById('addCompanyModal'));
      if (modal) {
        modal.hide();
        e.target.reset();
      }

      // Update search results if search is active
      const activeSearch = document.querySelector('.company-search:focus');
      if (activeSearch) {
        this.handleCompanySearch({ target: activeSearch }, activeSearch.nextElementSibling);
      }

      alert('Company added successfully!');
    } catch (error) {
      console.error('Error adding company:', error);
      alert('Failed to add company. Please try again.');
    }
  }

  handleCompanySearch(e, resultsContainer) {
    const query = e.target.value.trim().toLowerCase();
    
    if (query.length < 2) {
      resultsContainer.classList.add('d-none');
      return;
    }

    const matchingCompanies = this.companies.filter(company => {
      return company.name.toLowerCase().includes(query) ||
             company.phone.includes(query);
    });

    this.displaySearchResults(matchingCompanies, resultsContainer);
  }

  displaySearchResults(companies, resultsContainer) {
    resultsContainer.innerHTML = '';
    resultsContainer.classList.remove('d-none');

    if (!Array.isArray(companies) || companies.length === 0) {
      resultsContainer.innerHTML = `
        <div class="list-group-item text-center py-3">
          <div class="text-muted">No companies found</div>
          <button class="btn btn-sm btn-primary mt-2" data-bs-toggle="modal" data-bs-target="#addCompanyModal">
            <i class="fas fa-plus"></i> Add New Company
          </button>
        </div>`;
      return;
    }

    companies.forEach(company => {
      const item = document.createElement('div');
      item.className = 'list-group-item list-group-item-action';
      item.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h6 class="mb-1">${company.name}</h6>
            <div class="small">
              <i class="fas fa-phone me-1"></i>${company.phone}
              ${company.email ? `<br><i class="fas fa-envelope me-1"></i>${company.email}` : ''}
              ${company.address ? `<br><i class="fas fa-map-marker-alt me-1"></i>${company.address}` : ''}
            </div>
          </div>
          <button class="btn btn-sm btn-outline-primary select-company">
            <i class="fas fa-check"></i> Select
          </button>
        </div>
      `;
      
      const selectBtn = item.querySelector('.select-company');
      selectBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectCompany(company, resultsContainer);
      });
      
      item.addEventListener('click', () => {
        this.selectCompany(company, resultsContainer);
      });
      
      resultsContainer.appendChild(item);
    });
  }

  selectCompany(company, resultsContainer) {
    const isAuto = resultsContainer.id === 'autoCompanySearchResults';
    const searchInput = document.getElementById(isAuto ? 'autoCompanySearch' : 'companySearchInput');
    const billingNameInput = document.querySelector(`input[name="${isAuto ? 'auto' : ''}billingName"]`);

    if (searchInput && billingNameInput) {
      searchInput.value = company.name;
      billingNameInput.value = company.name;
      resultsContainer.classList.add('d-none');
    }
  }
}

// Initialize Company Manager
const companyManager = new CompanyManager();