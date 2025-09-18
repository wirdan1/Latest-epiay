document.addEventListener("DOMContentLoaded", async function() {
  document.body.classList.add("noscroll");
  hideLoader();
  try {
    const endpoints = await (await fetch("/endpoints")).json();
    const set = await (await fetch("/set")).json();
    setContent("api-icon", "href", set.icon);
    setContent("api-title", "textContent", set.name.main);
    setContent("api-description", "content", set.description);
    setContent("api-name", "textContent", set.name.main);
    setContent("api-author", "textContent", `by ${set.author}`);
    setContent("api-desc", "textContent", set.description);
    setContent("api-copyright", "textContent", `© 2025 ${set.name.copyright}. All rights reserved.`);
    setContent("api-info", "href", set.info_url);
    setupApiLinks(set);
    setupApiContent(endpoints);
    setupApiButtonHandlers(endpoints);
    setupSearchFunctionality();
  } catch (error) {
    console.error("Error loading configuration:", error);
  }

  function setContent(id, property, value) {
    const element = document.getElementById(id);
    if (element) element[property] = value;
  }

  function setupApiLinks(gtw) {
    const apiLinksContainer = document.getElementById("api-links");
    apiLinksContainer.innerHTML = "";
    if (apiLinksContainer && gtw.links?.length) {
      gtw.links.forEach(link => {
        const linkContainer = document.createElement("div");
        linkContainer.className = "flex items-center gap-2";
        const bulletPoint = document.createElement("div");
        bulletPoint.className = `w-2 h-2 bg-blue-200 rounded-full`;
        const linkElement = document.createElement("a");
        linkElement.href = link.url;
        linkElement.textContent = link.name;
        linkElement.className = "hover:underline";
        linkElement.target = "_blank";
        linkContainer.appendChild(bulletPoint);
        linkContainer.appendChild(linkElement);
        apiLinksContainer.appendChild(linkContainer);
      });
    }
  }
  
  const pageLoader = document.getElementById("page-loader");
  window.addEventListener("load", function() {
    setTimeout(function() {
      const scrollPosition = parseInt(document.body.style.top || "0") * -1;
      document.body.classList.remove("noscroll");
      document.body.style.top = "";
      window.scrollTo(0, scrollPosition);
      pageLoader.style.opacity = "0";
      setTimeout(function() {
        pageLoader.style.display = "none";
      }, 800);
    }, 1e3);
  });

  function showLoader() {
    const scrollPosition = window.scrollY;
    document.body.style.top = `-${scrollPosition}px`;
    document.body.classList.add("noscroll");
    pageLoader.style.display = "flex";
    pageLoader.style.opacity = "1";
  }

  function hideLoader() {
    setTimeout(function() {
      const scrollPosition = parseInt(document.body.style.top || "0") * -1;
      document.body.classList.remove("noscroll");
      document.body.style.top = "";
      window.scrollTo(0, scrollPosition);
      pageLoader.style.opacity = "0";
      setTimeout(function() {
        pageLoader.style.display = "none";
      }, 800);
    }, 1e3);
  }

  function setupApiContent(gtw) {
    const apiContent = document.getElementById("api-content");
    apiContent.innerHTML = "";
    const categoryNavContainer = document.querySelector(".category-nav-container");
    const categoryNav = document.querySelector(".category-nav");
    
    // Clear existing category tags except "ALL"
    const allCategory = categoryNav.querySelector('[data-category="all"]');
    categoryNav.innerHTML = "";
    categoryNav.appendChild(allCategory);
    
    const categories = [...new Set(gtw.endpoints.map(cat => cat.name))];
    categories.forEach(category => {
      const categoryTag = document.createElement("span");
      categoryTag.className = "category-tag";
      categoryTag.textContent = category.toUpperCase();
      categoryTag.dataset.category = category.toLowerCase();
      categoryNav.appendChild(categoryTag);
    });
    
    renderEndpoints(gtw.endpoints, "all");
    
    categoryNav.addEventListener("click", function(e) {
      if (e.target.classList.contains("category-tag")) {
        document.querySelectorAll(".category-tag").forEach(tag => {
          tag.classList.remove("active");
        });
        e.target.classList.add("active");
        const category = e.target.dataset.category;
        renderEndpoints(gtw.endpoints, category);
        e.target.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center"
        });
      }
    });
  }

  function renderEndpoints(endpoints, selectedCategory) {
    const apiContent = document.getElementById("api-content");
    apiContent.innerHTML = "";
    
    endpoints.forEach(category => {
      if (selectedCategory !== "all" && category.name.toLowerCase() !== selectedCategory) {
        return;
      }
      
      const categoryTitle = document.createElement("h2");
      categoryTitle.className = "text-xl font-semibold mb-4 col-span-full mt-6 first:mt-0";
      categoryTitle.textContent = category.name;
      
      const countSpan = document.createElement("span");
      countSpan.className = "ml-2 bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full";
      countSpan.textContent = Object.keys(category.items).length;
      categoryTitle.appendChild(countSpan);
      
      apiContent.appendChild(categoryTitle);
      
      const endpointsContainer = document.createElement("div");
      endpointsContainer.className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 col-span-full mb-8";
      
      const sortedItems = Object.entries(category.items).sort(([, a], [, b]) => (a.name || "").localeCompare(b.name || "")).map(([, item]) => item);
      
      sortedItems.forEach(itemData => {
        const itemName = Object.keys(itemData)[0];
        const item = itemData[itemName];
        const itemElement = createApiItemElement(itemName, item);
        endpointsContainer.appendChild(itemElement);
      });
      
      apiContent.appendChild(endpointsContainer);
    });
  }

  function createApiItemElement(itemName, item) {
    const itemDiv = document.createElement("div");
    itemDiv.className = "endpoint-item fade-in";
    itemDiv.dataset.name = itemName || "";
    itemDiv.dataset.desc = item.desc || "";
    
    const headerDiv = document.createElement("div");
    headerDiv.className = "endpoint-header";
    
    const method = document.createElement("span");
    method.className = `method-badge ${item.method === 'POST' ? 'method-post' : 'method-get'}`;
    method.textContent = item.method || "GET";
    
    const path = document.createElement("span");
    path.className = "endpoint-path text-truncate";
    path.textContent = item.path;
    
    headerDiv.appendChild(method);
    headerDiv.appendChild(path);
    
    const title = document.createElement("h4");
    title.className = "text-md font-semibold mb-2";
    title.textContent = itemName || "Unnamed Item";
    
    const description = document.createElement("p");
    description.className = "endpoint-desc";
    description.textContent = item.desc || "No description";
    
    const button = document.createElement("button");
    button.className = "btn btn-primary";
    button.dataset.apiPath = item.path || "";
    button.dataset.apiName = itemName || "";
    button.dataset.apiDesc = item.desc || "";
    button.textContent = "Try it";
    
    itemDiv.appendChild(headerDiv);
    itemDiv.appendChild(title);
    itemDiv.appendChild(description);
    itemDiv.appendChild(button);
    
    return itemDiv;
  }

  function openApiModal(name, endpoint, description, method) {
    const modal = document.getElementById("api-modal");
    const closeModalBtn = document.getElementById("close-modal");
    const submitApiBtn = document.getElementById("submit-api");
    const modalTitle = document.getElementById("modal-title");
    const apiMethod = document.getElementById("api-method");
    const apiDescription = document.getElementById("api-description");
    const paramsContainer = document.getElementById("params-container");
    const responseContainer = document.getElementById("response-container");
    const responseData = document.getElementById("response-data");
    const responseStatus = document.getElementById("response-status");
    const responseTime = document.getElementById("response-time");
    
    const existingUrlDisplay = document.querySelector(".urlDisplay");
    if (existingUrlDisplay) existingUrlDisplay.remove();
    
    responseContainer.classList.add("hidden");
    responseData.innerHTML = "";
    submitApiBtn.classList.remove("hidden");
    paramsContainer.classList.remove("hidden");
    paramsContainer.innerHTML = "";
    
    modalTitle.textContent = name;
    apiDescription.textContent = description;
    apiMethod.textContent = method || "GET";
    apiMethod.className = `method-badge ${method === 'POST' ? 'method-post' : 'method-get'} mr-2`;
    
    const url = new URL(endpoint, window.location.origin);
    const urlParams = url.search ? url.search.substring(1).split("&") : [];
    
    // Handle query parameters
    if (urlParams.length) {
      urlParams.forEach(param => {
        const [key] = param.split("=");
        if (key) {
          const isOptional = key.startsWith("_");
          const paramField = document.createElement("div");
          paramField.className = "mb-3";
          paramField.innerHTML = `
            <input type="text" id="param-${key}" class="input-field" placeholder="Enter ${key}${isOptional ? " (optional)" : ""}">
            <div id="error-${key}" class="text-red-500 text-xs mt-1 hidden">This field is required</div>
          `;
          paramsContainer.appendChild(paramField);
        }
      });
    }
    
    // Handle path parameters (placeholders like {param})
    const placeholderMatch = endpoint.match(/{([^}]+)}/g);
    if (placeholderMatch) {
      placeholderMatch.forEach(match => {
        const paramName = match.replace(/{|}/g, "");
        const isOptional = paramName.startsWith("_");
        const paramField = document.createElement("div");
        paramField.className = "mb-3";
        paramField.innerHTML = `
          <input type="text" id="param-${paramName}" class="input-field" placeholder="Enter ${paramName}${isOptional ? " (optional)" : ""}">
          <div id="error-${paramName}" class="text-red-500 text-xs mt-1 hidden">This field is required</div>
        `;
        paramsContainer.appendChild(paramField);
      });
    }
    
    // Show modal
    modal.classList.add("active");
    document.body.classList.add("noscroll");
    
    const closeModal = function() {
      modal.classList.remove("active");
      document.body.classList.remove("noscroll");
    };
    
    closeModalBtn.onclick = closeModal;
    modal.addEventListener("click", function(event) {
      if (event.target === modal) {
        closeModal();
      }
    });
    
    document.addEventListener("keydown", function(event) {
      if (event.key === "Escape") {
        closeModal();
      }
    }, { once: true });
    
    submitApiBtn.onclick = async function() {
      let isValid = true;
      document.querySelectorAll('[id^="error-"]').forEach(errorElement => {
        errorElement.classList.add("hidden");
      });
      
      const paramInputs = paramsContainer.querySelectorAll("input");
      paramInputs.forEach(input => {
        const paramName = input.id.replace("param-", "");
        const paramValue = input.value.trim();
        const errorElement = document.getElementById(`error-${paramName}`);
        if (!paramName.startsWith("_") && paramValue === "") {
          isValid = false;
          errorElement.classList.remove("hidden");
          input.classList.add("border-red-500");
        } else {
          errorElement.classList.add("hidden");
          input.classList.remove("border-red-500");
        }
      });
      
      if (!isValid) return;
      
      responseContainer.classList.remove("hidden");
      paramsContainer.classList.add("hidden");
      submitApiBtn.classList.add("hidden");
      
      const startTime = Date.now();
      
      try {
        let apiUrl = endpoint;
        
        // Replace path parameters and handle query parameters
        if (paramInputs.length > 0) {
          Array.from(paramInputs).forEach(input => {
            const paramName = input.id.replace("param-", "");
            const paramValue = input.value.trim();
            if (paramName.startsWith("_") && paramValue === "") {
              return;
            }
            if (apiUrl.includes(`{${paramName}}`)) {
              apiUrl = apiUrl.replace(`{${paramName}}`, encodeURIComponent(paramValue));
            } else if (paramValue !== "") {
              const urlObj = new URL(apiUrl, window.location.origin);
              urlObj.searchParams.set(paramName, paramValue);
              apiUrl = urlObj.pathname + urlObj.search;
            }
          });
        }
        
        const fullUrl = new URL(apiUrl, window.location.origin).href;
        const urlDisplayDiv = document.createElement("div");
        urlDisplayDiv.className = "urlDisplay mb-4 p-3 bg-gray-50 font-mono text-xs overflow-hidden";
        const urlContent = document.createElement("div");
        urlContent.className = "break-all";
        urlContent.textContent = fullUrl;
        urlDisplayDiv.appendChild(urlContent);
        responseContainer.parentNode.insertBefore(urlDisplayDiv, responseContainer);
        
        responseData.innerHTML = "Loading...";
        
        const requestOptions = {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          }
        };
        
        const response = await fetch(apiUrl, requestOptions);
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        responseStatus.textContent = response.status;
        responseStatus.className = response.ok ? "method-badge method-get mr-2" : "method-badge method-post mr-2";
        responseTime.textContent = `${duration}ms`;
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "API request failed");
        }
        
        const contentType = response.headers.get("content-type");
        if (contentType && (contentType.includes("image/") || contentType.includes("video/") || contentType.includes("audio/") || contentType.includes("application/octet-stream"))) {
          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);
          if (contentType.includes("image/")) {
            responseData.innerHTML = `<img src='${objectUrl}' alt='Response Image' class='max-w-full h-auto' />`;
          } else if (contentType.includes("video/")) {
            responseData.innerHTML = `
              <video controls class='max-w-full'>
                <source src='${objectUrl}' type='${contentType}'>
                Your browser does not support the video tag.
              </video>`;
          } else if (contentType.includes("audio/")) {
            responseData.innerHTML = `
              <audio controls class='w-full'>
                <source src='${objectUrl}' type='${contentType}'>
                Your browser does not support the audio tag.
              </audio>`;
          } else {
            responseData.innerHTML = `
              <div class='text-center p-4'>
                <p class='mb-2'>Binary data received (${blob.size} bytes)</p>
                <a href='${objectUrl}' download='response-data' class='px-4 py-2 bg-blue-500 text-white hover:bg-blue-600'>Download File</a>
              </div>`;
          }
        } else if (contentType && contentType.includes("application/json")) {
          const jsonData = await response.json();
          responseData.innerHTML = `<pre class='whitespace-pre-wrap break-words'>${JSON.stringify(jsonData, null, 2)}</pre>`;
        } else {
          const text = await response.text();
          responseData.innerHTML = `<pre class='whitespace-pre-wrap break-words'>${text}</pre>`;
        }
      } catch (error) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        responseStatus.textContent = "Error";
        responseStatus.className = "method-badge method-post mr-2";
        responseTime.textContent = `${duration}ms`;
        
        responseData.innerHTML = `
          <div class="p-3 bg-red-50 border-l-4 border-red-500 rounded">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm text-red-700">
                  ${error.message || "Invalid API key - please use a valid API key"}
                </p>
              </div>
            </div>
          </div>
        `;
      }
    };
  }

  function setupApiButtonHandlers(gtw) {
    document.addEventListener("click", event => {
      if (event.target.classList.contains("btn-primary") && event.target.dataset.apiPath) {
        const { apiPath, apiName, apiDesc } = event.target.dataset;
        const currentItem = gtw.endpoints.flatMap(category => Object.values(category.items))
          .map(itemData => {
            const itemName = Object.keys(itemData)[0];
            return { name: itemName, ...itemData[itemName] };
          })
          .find(item => item.path === apiPath && item.name === apiName);
        
        openApiModal(apiName, apiPath, apiDesc, currentItem?.method);
      }
    });
  }

  function setupSearchFunctionality() {
    const searchInput = document.getElementById("api-search");
    if (!searchInput) return;
    
    let originalEndpoints = null;
    let currentCategory = "all";
    
    document.querySelector(".category-nav").addEventListener("click", function(e) {
      if (e.target.classList.contains("category-tag")) {
        currentCategory = e.target.dataset.category;
        if (searchInput.value.trim()) {
          searchInput.dispatchEvent(new Event("input"));
        }
      }
    });

    function captureOriginalData() {
      const categories = document.querySelectorAll("#api-content > div");
      const result = [];
      
      categories.forEach(category => {
        if (category.classList.contains("col-span-full")) {
          const categoryName = category.querySelector("h2").textContent.toLowerCase();
          const endpointsGrid = category.nextElementSibling;
          
          const items = Array.from(endpointsGrid.querySelectorAll(".endpoint-item")).map(item => {
            return {
              element: item.cloneNode(true),
              name: item.dataset.name,
              desc: item.dataset.desc,
              category: categoryName
            };
          });
          
          result.push({
            categoryElement: category,
            categoryName: categoryName,
            endpointsGrid: endpointsGrid,
            items: items
          });
        }
      });
      
      return result;
    }

    function restoreOriginalData() {
      if (!originalEndpoints) return;
      
      const apiContent = document.getElementById("api-content");
      apiContent.innerHTML = "";
      
      originalEndpoints.forEach(categoryData => {
        if (currentCategory === "all" || categoryData.categoryName === currentCategory) {
          apiContent.appendChild(categoryData.categoryElement);
          apiContent.appendChild(categoryData.endpointsGrid);
        }
      });
    }
    
    searchInput.addEventListener("input", function(e) {
      const searchTerm = e.target.value.toLowerCase().trim();
      
      if (!originalEndpoints) {
        originalEndpoints = captureOriginalData();
      }
      
      if (!searchTerm) {
        restoreOriginalData();
        return;
      }
      
      const apiContent = document.getElementById("api-content");
      apiContent.innerHTML = "";
      
      originalEndpoints.forEach(categoryData => {
        const shouldShowCategory = currentCategory === "all" || categoryData.categoryName === currentCategory;
        
        if (!shouldShowCategory) return;
        
        const visibleItems = categoryData.items.filter(item => {
          const title = item.name?.toLowerCase() || "";
          const desc = item.desc?.toLowerCase() || "";
          return title.includes(searchTerm) || desc.includes(searchTerm);
        });
        
        if (visibleItems.length === 0) return;
        
        // Add category title
        const categoryTitle = categoryData.categoryElement.cloneNode(true);
        apiContent.appendChild(categoryTitle);
        
        // Add endpoints container
        const endpointsContainer = document.createElement("div");
        endpointsContainer.className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 col-span-full mb-8";
        
        visibleItems.forEach(item => {
          endpointsContainer.appendChild(item.element.cloneNode(true));
        });
        
        apiContent.appendChild(endpointsContainer);
      });
    });
  }

  // Helper function for capitalizing strings
  String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
  };
});
