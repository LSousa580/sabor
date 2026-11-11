/* =========================================================
   CONFIGURAÇÃO
   ========================================================= */

const ROTA = "http://localhost:3000/api/produto/listar";


/* =========================================================
   ESTADO DA APLICAÇÃO
   ========================================================= */

let products = [];

let activeCategory = "todos";
let currentSearch = "";
let currentSort = "default";
let showingAllProducts = false;


/**
 * Lê e valida dados do localStorage.
 * Se o dado estiver ausente, corrompido ou não for array,
 * retorna uma lista vazia.
 */
function lerStorage(chave) {
    try {
        const dado = JSON.parse(localStorage.getItem(chave));

        return Array.isArray(dado) ? dado : [];
    } catch (error) {
        console.warn(`Não foi possível ler "${chave}" do localStorage.`, error);
        return [];
    }
}

/**
 * Converte IDs antigos salvos como string para número.
 * Exemplo: ["1", 2] -> [1, 2]
 */
function normalizarIds(lista) {
    return lista
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0);
}

/**
 * Garante que o carrinho tenha apenas itens válidos.
 */
function normalizarCarrinho(lista) {
    return lista
        .map((item) => ({
            id: Number(item?.id),
            quantity: Number(item?.quantity)
        }))
        .filter(
            (item) =>
                Number.isInteger(item.id) &&
                item.id > 0 &&
                Number.isInteger(item.quantity) &&
                item.quantity > 0
        );
}

let favorites = normalizarIds(lerStorage("saborFavorites"));
let cart = normalizarCarrinho(lerStorage("saborCart"));


/* =========================================================
   ELEMENTOS DO DOM
   ========================================================= */

const productGrid = document.getElementById("productGrid");
const emptyState = document.getElementById("emptyState");
const productsMessage = document.getElementById("productsMessage");
const searchInput = document.getElementById("searchInput");
const searchForm = document.getElementById("searchForm");
const showAllProductsButton = document.getElementById("showAllProducts");

const cartCount = document.getElementById("cartCount");
const cartCountMobile = document.getElementById("cartCountMobile");
const cartItems = document.getElementById("cartItems");
const cartEmpty = document.getElementById("cartEmpty");
const cartSummary = document.getElementById("cartSummary");
const cartTotal = document.getElementById("cartTotal");
const cartItemsText = document.getElementById("cartItemsText");

const cepForm = document.getElementById("cepForm");
const cepInput = document.getElementById("cepInput");
const cepButtonText = document.getElementById("cepButtonText");

const newsletterForm = document.getElementById("newsletterForm");
const checkoutButton = document.getElementById("checkoutButton");
const currentYear = document.getElementById("currentYear");


/* =========================================================
   FUNÇÕES AUXILIARES
   ========================================================= */

function formatPrice(value) {
    const price = Number(value);

    if (!Number.isFinite(price)) {
        return "Preço indisponível";
    }

    return price.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

/**
 * Evita XSS ao inserir textos vindos da API no HTML.
 */
function escapeHTML(texto) {
    return String(texto ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function saveFavorites() {
    try {
        localStorage.setItem("saborFavorites", JSON.stringify(favorites));
    } catch (error) {
        console.error("Erro ao salvar favoritos:", error);
    }
}

function saveCart() {
    try {
        localStorage.setItem("saborCart", JSON.stringify(cart));
    } catch (error) {
        console.error("Erro ao salvar carrinho:", error);
    }
}

function getProductById(id) {
    return products.find((product) => product.id === Number(id));
}

function showToast(message) {
    if (typeof M === "undefined" || !M.toast) {
        console.log(message.replace(/<[^>]*>/g, ""));
        return;
    }

    M.toast({
        html: message,
        displayLength: 2600,
        classes: "rounded"
    });
}

function scrollToProducts() {
    const produtos = document.getElementById("produtos");

    if (produtos) {
        produtos.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}

function resetCategoryButtons() {
    document.querySelectorAll(".category").forEach((category) => {
        category.classList.remove("active");

        if (category.dataset.category === "todos") {
            category.classList.add("active");
        }
    });
}


/* =========================================================
   CARREGAR PRODUTOS DA API
   ========================================================= */

async function carregarProdutos() {
    try {
        const response = await fetch(ROTA);

        if (!response.ok) {
            throw new Error(`ERRO HTTP ${response.status}`);
        }

        const dados = await response.json();

        if (!Array.isArray(dados)) {
            throw new Error("A API não devolveu uma lista de produtos.");
        }

        products = dados
            .map((produto) => ({
                ...produto,
                id: Number(produto.id),
                price: Number(produto.price),
                oldPrice:
                    produto.oldPrice !== null &&
                    produto.oldPrice !== undefined &&
                    produto.oldPrice !== ""
                        ? Number(produto.oldPrice)
                        : null
            }))
            .filter(
                (produto) =>
                    Number.isInteger(produto.id) &&
                    produto.id > 0 &&
                    Number.isFinite(produto.price)
            );

        console.log("Produtos carregados:", products);

        // Remove do carrinho produtos que não existem mais na API.
        cart = cart.filter((item) => getProductById(item.id));

        saveCart();

        renderProducts();
        updateCart();
    } catch (error) {
        console.error("Erro ao carregar produtos:", error);

        if (productGrid) {
            productGrid.innerHTML = `
                <p class="error-message">
                    Não foi possível carregar os produtos.
                    Verifique se a API está em execução.
                </p>
            `;
        }

        if (emptyState) {
            emptyState.classList.remove("hide");
        }

        if (productsMessage) {
            productsMessage.textContent =
                "Não foi possível conectar ao servidor de produtos.";
        }
    }
}


/* =========================================================
   INÍCIO ÚNICO + MATERIALIZE
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
    if (typeof M !== "undefined") {
        M.Sidenav.init(document.querySelectorAll(".sidenav"));

        M.Modal.init(document.querySelectorAll(".modal"), {
            opacity: 0.55
        });

        M.Dropdown.init(document.querySelectorAll(".dropdown-trigger"), {
            coverTrigger: false,
            constrainWidth: false,
            alignment: "right",
            closeOnClick: true
        });
    }

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }

    updateCart();
    carregarProdutos();
});


/* =========================================================
   FILTRO E RENDERIZAÇÃO DOS PRODUTOS
   ========================================================= */

function getFilteredProducts() {
    let filteredProducts = [...products];

    if (activeCategory !== "todos") {
        filteredProducts = filteredProducts.filter(
            (product) => product.category === activeCategory
        );
    }

    const term = currentSearch.trim().toLowerCase();

    if (term !== "") {
        filteredProducts = filteredProducts.filter((product) => {
            const name = String(product.name ?? "").toLowerCase();
            const category = String(product.category ?? "").toLowerCase();
            const categoryLabel = String(
                product.categoryLabel ?? ""
            ).toLowerCase();

            return (
                name.includes(term) ||
                category.includes(term) ||
                categoryLabel.includes(term)
            );
        });
    }

    if (currentSort === "az") {
        filteredProducts.sort((a, b) =>
            String(a.name ?? "").localeCompare(
                String(b.name ?? ""),
                "pt-BR",
                {
                    sensitivity: "base"
                }
            )
        );
    }

    if (currentSort === "price-asc") {
        filteredProducts.sort((a, b) => a.price - b.price);
    }

    if (currentSort === "price-desc") {
        filteredProducts.sort((a, b) => b.price - a.price);
    }

    return filteredProducts;
}

function renderProducts() {
    if (!productGrid || !emptyState || !showAllProductsButton) {
        return;
    }

    const filteredProducts = getFilteredProducts();

    const visibleProducts = showingAllProducts
        ? filteredProducts
        : filteredProducts.slice(0, 8);

    productGrid.innerHTML = "";

    if (filteredProducts.length === 0) {
        emptyState.classList.remove("hide");
        showAllProductsButton.classList.add("hide");

        if (productsMessage) {
            productsMessage.textContent =
                "Não encontramos itens para esta busca.";
        }

        return;
    }

    emptyState.classList.add("hide");

    let html = "";

    visibleProducts.forEach((product) => {
        const isFavorite = favorites.includes(product.id);
        const name = escapeHTML(product.name);

        const oldPriceHTML =
            product.oldPrice && product.oldPrice > product.price
                ? `<span class="price-old">${formatPrice(product.oldPrice)}</span>`
                : "";

        const badgeHTML = product.badge
            ? `<span class="product-badge">${escapeHTML(product.badge)}</span>`
            : "";

        html += `
            <article class="product-card">
                <div class="product-image-wrapper">
                    ${badgeHTML}

                    <button
                        class="favorite ${isFavorite ? "active" : ""}"
                        type="button"
                        data-favorite="${product.id}"
                        aria-label="${
                            isFavorite
                                ? `Remover ${name} dos favoritos`
                                : `Adicionar ${name} aos favoritos`
                        }"
                        title="${
                            isFavorite
                                ? "Remover dos favoritos"
                                : "Adicionar aos favoritos"
                        }"
                    >
                        <i class="material-icons">
                            ${isFavorite ? "favorite" : "favorite_border"}
                        </i>
                    </button>

                    <img
                        class="product-image"
                        src="${escapeHTML(product.image)}"
                        alt="${name}"
                        loading="lazy"
                    >
                </div>

                <div class="product-info">
                    <span class="product-category">
                        ${escapeHTML(product.categoryLabel)}
                    </span>

                    <h3>${name}</h3>

                    <p class="product-unit">
                        ${escapeHTML(product.unit)}
                    </p>

                    <div class="price-row">
                        <span class="price">
                            ${formatPrice(product.price)}
                        </span>

                        ${oldPriceHTML}
                    </div>

                    <button
                        class="btn-add waves-effect"
                        type="button"
                        data-add="${product.id}"
                    >
                        <i class="material-icons left">add_shopping_cart</i>
                        Adicionar
                    </button>
                </div>
            </article>
        `;
    });

    productGrid.innerHTML = html;

    updateProductsMessage(filteredProducts.length);

    if (filteredProducts.length > 8 && !showingAllProducts) {
        showAllProductsButton.classList.remove("hide");
        showAllProductsButton.textContent = "Ver todos os produtos";
    } else if (showingAllProducts && filteredProducts.length > 8) {
        showAllProductsButton.classList.remove("hide");
        showAllProductsButton.textContent = "Mostrar menos";
    } else {
        showAllProductsButton.classList.add("hide");
    }
}

function updateProductsMessage(quantity) {
    if (!productsMessage) {
        return;
    }

    const categoryNames = {
        todos: "todos os produtos",
        frutas: "frutas",
        verduras: "verduras",
        legumes: "legumes",
        temperos: "temperos",
        polpas: "polpas",
        naturais: "produtos naturais",
        outros: "produtos regionais"
    };

    if (currentSearch.trim() !== "") {
        productsMessage.textContent =
            `${quantity} produto(s) encontrado(s) para “${currentSearch.trim()}”.`;
        return;
    }

    if (activeCategory !== "todos") {
        productsMessage.textContent =
            `Confira ${quantity} opção(ões) em ${
                categoryNames[activeCategory] || activeCategory
            }.`;
        return;
    }

    productsMessage.textContent =
        "Confira produtos frescos disponíveis para você.";
}


/* =========================================================
   CATEGORIAS
   ========================================================= */

document.querySelectorAll(".category").forEach((button) => {
    button.addEventListener("click", function () {
        activeCategory = this.dataset.category || "todos";
        currentSearch = "";

        if (searchInput) {
            searchInput.value = "";
        }

        showingAllProducts = false;

        document.querySelectorAll(".category").forEach((category) => {
            category.classList.remove("active");
        });

        this.classList.add("active");

        renderProducts();
        scrollToProducts();
    });
});


/* =========================================================
   BUSCA
   ========================================================= */

if (searchForm) {
    searchForm.addEventListener("submit", function (event) {
        event.preventDefault();

        currentSearch = searchInput ? searchInput.value : "";
        activeCategory = "todos";
        showingAllProducts = true;

        resetCategoryButtons();
        renderProducts();
        scrollToProducts();
    });
}

if (searchInput) {
    searchInput.addEventListener("input", function () {
        if (this.value.trim() === "") {
            currentSearch = "";
            showingAllProducts = false;
            renderProducts();
        }
    });
}


/* =========================================================
   ORDENAÇÃO
   ========================================================= */

document.querySelectorAll("[data-sort]").forEach((button) => {
    button.addEventListener("click", function () {
        currentSort = this.dataset.sort;
        renderProducts();

        const sortLabels = {
            default: "Destaques",
            az: "Nome: A-Z",
            "price-asc": "Menor preço",
            "price-desc": "Maior preço"
        };

        showToast(
            `Ordenado por: <b>${escapeHTML(
                sortLabels[currentSort] || "Destaques"
            )}</b>`
        );
    });
});


/* =========================================================
   MOSTRAR TODOS
   ========================================================= */

if (showAllProductsButton) {
    showAllProductsButton.addEventListener("click", function () {
        showingAllProducts = !showingAllProducts;
        renderProducts();

        if (!showingAllProducts) {
            scrollToProducts();
        }
    });
}


/* =========================================================
   CLIQUES: FAVORITOS, CARRINHO E SUGESTÕES
   ========================================================= */

document.addEventListener("click", function (event) {
    if (!(event.target instanceof Element)) {
        return;
    }

    const favoriteButton = event.target.closest("[data-favorite]");
    const addButton = event.target.closest("[data-add]");
    const seasonButton = event.target.closest("[data-search]");
    const increaseButton = event.target.closest("[data-increase]");
    const decreaseButton = event.target.closest("[data-decrease]");
    const removeButton = event.target.closest("[data-remove]");

    if (favoriteButton) {
        const productId = Number(favoriteButton.dataset.favorite);

        if (favorites.includes(productId)) {
            favorites = favorites.filter((id) => id !== productId);
            showToast("Produto removido dos favoritos.");
        } else {
            favorites.push(productId);
            showToast("Produto adicionado aos favoritos.");
        }

        saveFavorites();
        renderProducts();
        return;
    }

    if (addButton) {
        addToCart(Number(addButton.dataset.add));
        return;
    }

    if (seasonButton) {
        currentSearch = seasonButton.dataset.search || "";

        if (searchInput) {
            searchInput.value = currentSearch;
        }

        activeCategory = "todos";
        showingAllProducts = true;

        resetCategoryButtons();
        renderProducts();
        scrollToProducts();
        return;
    }

    if (increaseButton) {
        const productId = Number(increaseButton.dataset.increase);
        const item = cart.find(
            (cartItem) => cartItem.id === productId
        );

        if (item) {
            item.quantity += 1;
            saveCart();
            updateCart();
        }

        return;
    }

    if (decreaseButton) {
        const productId = Number(decreaseButton.dataset.decrease);
        const item = cart.find(
            (cartItem) => cartItem.id === productId
        );

        if (item && item.quantity > 1) {
            item.quantity -= 1;
        } else {
            cart = cart.filter(
                (cartItem) => cartItem.id !== productId
            );
        }

        saveCart();
        updateCart();
        return;
    }

    if (removeButton) {
        const productId = Number(removeButton.dataset.remove);

        cart = cart.filter(
            (cartItem) => cartItem.id !== productId
        );

        saveCart();
        updateCart();

        showToast("Produto removido do carrinho.");
    }
});


/* =========================================================
   CARRINHO
   ========================================================= */

function addToCart(productId) {
    const product = getProductById(productId);

    if (!product) {
        showToast("Produto indisponível no momento.");
        return;
    }

    const item = cart.find((cartItem) => cartItem.id === productId);

    if (item) {
        item.quantity += 1;
    } else {
        cart.push({
            id: productId,
            quantity: 1
        });
    }

    saveCart();
    updateCart();

    showToast(
        `<b>${escapeHTML(product.name)}</b> foi adicionado ao carrinho.`
    );
}

function updateCart() {
    const totalItems = cart.reduce(
        (sum, item) => sum + item.quantity,
        0
    );

    if (cartCount) {
        cartCount.textContent = totalItems;
    }

    if (cartCountMobile) {
        cartCountMobile.textContent = totalItems;
    }

    renderCartItems();
}

function renderCartItems() {
    if (!cartItems || !cartEmpty || !cartSummary || !cartTotal) {
        return;
    }

    cartItems.innerHTML = "";

    if (cart.length === 0) {
        cartEmpty.classList.remove("hide");
        cartSummary.classList.add("hide");

        if (cartItemsText) {
            cartItemsText.textContent = "Seu carrinho está vazio.";
        }

        cartTotal.textContent = formatPrice(0);
        return;
    }

    cartEmpty.classList.add("hide");
    cartSummary.classList.remove("hide");

    const totalItems = cart.reduce(
        (sum, item) => sum + item.quantity,
        0
    );

    if (cartItemsText) {
        cartItemsText.textContent =
            `${totalItems} item(ns) adicionado(s) ao seu pedido.`;
    }

    let total = 0;
    let html = "";

    cart.forEach((item) => {
        const product = getProductById(item.id);

        if (!product) {
            return;
        }

        const name = escapeHTML(product.name);
        const subtotal = product.price * item.quantity;

        total += subtotal;

        html += `
            <div class="cart-item">
                <img
                    src="${escapeHTML(product.image)}"
                    alt="${name}"
                    class="cart-item-image"
                >

                <div>
                    <h5>${name}</h5>

                    <small>${escapeHTML(product.unit)}</small>

                    <div class="cart-item-price">
                        ${formatPrice(subtotal)}
                    </div>

                    <button
                        type="button"
                        class="remove-item"
                        data-remove="${product.id}"
                    >
                        Remover
                    </button>
                </div>

                <div class="cart-controls">
                    <button
                        type="button"
                        data-decrease="${product.id}"
                        aria-label="Diminuir quantidade de ${name}"
                    >
                        <i class="material-icons">remove</i>
                    </button>

                    <span>${item.quantity}</span>

                    <button
                        type="button"
                        data-increase="${product.id}"
                        aria-label="Aumentar quantidade de ${name}"
                    >
                        <i class="material-icons">add</i>
                    </button>
                </div>
            </div>
        `;
    });

    cartItems.innerHTML = html;
    cartTotal.textContent = formatPrice(total);
}


/* =========================================================
   FINALIZAR PEDIDO
   ========================================================= */

if (checkoutButton) {
    checkoutButton.addEventListener("click", function () {
        if (cart.length === 0) {
            showToast("Seu carrinho ainda está vazio.");
            return;
        }

        showToast(
            "Pedido iniciado! Em uma loja real, você seguiria para o pagamento."
        );
    });
}


/* =========================================================
   CEP
   ========================================================= */

if (cepInput) {
    cepInput.addEventListener("input", function () {
        let value = this.value.replace(/\D/g, "");

        if (value.length > 5) {
            value = `${value.slice(0, 5)}-${value.slice(5, 8)}`;
        }

        this.value = value;
    });
}

if (cepForm) {
    cepForm.addEventListener("submit", function (event) {
        event.preventDefault();

        if (!cepInput) {
            return;
        }

        const cep = cepInput.value.replace(/\D/g, "");

        if (cep.length !== 8) {
            showToast("Digite um CEP válido com 8 números.");
            return;
        }

        if (cepButtonText) {
            cepButtonText.textContent = `CEP: ${cepInput.value}`;
        }

        const modalElement = document.getElementById("cepModal");
        const modalInstance =
            typeof M !== "undefined" && modalElement
                ? M.Modal.getInstance(modalElement)
                : null;

        if (modalInstance) {
            modalInstance.close();
        }

        showToast("Entrega consultada para a sua região.");
    });
}


/* =========================================================
   NEWSLETTER
   ========================================================= */

if (newsletterForm) {
    newsletterForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const email = document
            .getElementById("newsletterEmail")
            ?.value.trim();

        if (!email) {
            return;
        }

        showToast(
            "Cadastro realizado! Você receberá nossas novidades."
        );

        newsletterForm.reset();
    });
}