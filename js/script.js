// Functii globale (pot fi apelate si din scripturile inline daca sunt declarate global)
function generateProductId(titlu) { // Folosit de loadRecommendedProducts
    if (!titlu) return 'produs-necunoscut';
    return titlu.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, '-');
}

function getProductImageName(titlu) { // Folosit de loadRecommendedProducts
    const id = generateProductId(titlu);
    return `carte-${id}.jpg`; 
}

// Functie globala pentru adaugare in cos (apelata de butoanele de produs)
function addToCart(id, nume, pret, imageName) {
    let cart = JSON.parse(localStorage.getItem('arcantiaCart')) || [];
    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id, nume, pret, imagine: `images/${imageName}`, quantity: 1 });
    }

    localStorage.setItem('arcantiaCart', JSON.stringify(cart));
    alert(`${nume} a fost adăugat în coș!`);
    updateCartCount();
}


document.addEventListener('DOMContentLoaded', () => {
    // Initializare Swiper
    if (document.querySelector('.swiper-container')) {
        new Swiper('.swiper-container', {
            loop: true,
            autoplay: {
                delay: 5000,
                disableOnInteraction: false,
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
        });
    }

    // Incarcare produse recomandate pe pagina Acasa
    if (document.getElementById('recomandate-container')) {
        loadRecommendedProducts(); // Aceasta functie va folosi generateProductId si getProductImageName globale
    }

    // Logica pentru "Citirea Zilei" (Tarot)
    const tarotButton = document.getElementById('get-tarot-card');
    if (tarotButton) {
        tarotButton.addEventListener('click', displayRandomTarotCard);
    }

    // Logica pentru Cosul de Cumparaturi (pe pagina cos.html)
    if (document.getElementById('cos-items-body')) {
        renderCart();
    }
    
    // Actualizeaza contorul cosului la incarcarea fiecarei pagini
    updateCartCount(); 

    // Validare simpla formular contact
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const nume = document.getElementById('nume').value;
            const email = document.getElementById('email').value;
            const mesaj = document.getElementById('mesaj').value;

            if (nume && email && mesaj) {
                alert('Mesajul a fost trimis! Vă mulțumim.');
                contactForm.reset();
            } else {
                alert('Vă rugăm completați toate câmpurile obligatorii.');
            }
        });
    }

    // NU MAI AVEM NEVOIE DE CODUL PENTRU BUTOANELE DE HOROSCOP AICI
    // DEOARECE ESTE GESTIONAT PRIN CSS (CHECKBOX HACK)

}); // Sfarsitul DOMContentLoaded


// --- Functii pentru Produse Recomandate (index.html) ---
async function loadRecommendedProducts() {
    try {
        const response = await fetch('proiect.xml'); // Asigura-te ca fisierul este la radacina
        if (!response.ok) throw new Error(`Eroare HTTP! Status: ${response.status} - ${response.statusText}.`);
        const xmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "application/xml");

        const errorNode = xmlDoc.querySelector('parsererror');
        if (errorNode) {
            console.error('Eroare la parsarea XML (recomandate):', errorNode.textContent);
            throw new Error('Fișierul XML nu a putut fi parsat corect (recomandate).');
        }

        const carti = xmlDoc.getElementsByTagName('carte');
        const recomandateContainer = document.getElementById('recomandate-container');

        if (!recomandateContainer) return;
        recomandateContainer.innerHTML = ''; 

        const numRecomandate = Math.min(carti.length, 3);
        if (numRecomandate === 0 && carti.length > 0) {
            recomandateContainer.innerHTML = "<p>Nu s-au putut încărca produsele recomandate.</p>";
            return;
        } else if (carti.length === 0) {
             recomandateContainer.innerHTML = "<p>Nu există produse în baza de date pentru a recomanda.</p>";
            return;
        }

        for (let i = 0; i < numRecomandate; i++) {
            const carte = carti[i];
            const titluNode = carte.getElementsByTagName('titlu')[0];
            const autorNode = carte.getElementsByTagName('autor')[0];
            const pretNode = carte.getElementsByTagName('pret')[0];

            if (!titluNode || !autorNode || !pretNode) {
                console.warn("O carte pentru recomandate este incompletă. Va fi omisă.", carte.innerHTML);
                continue;
            }

            const titlu = titluNode.textContent;
            const autor = autorNode.textContent;
            const pret = parseFloat(pretNode.textContent).toFixed(2);
            
            const id = generateProductId(titlu); 
            const imageName = getProductImageName(titlu); 
            const titluEscapat = titlu.replace(/'/g, "\\'");

            const card = document.createElement('div');
            card.classList.add('produs-card');
            card.innerHTML = `
                <img src="images/${imageName}" alt="${titlu}" onerror="this.onerror=null;this.src='images/default-book-cover.jpg';">
                <div class="produs-card-content">
                    <div>
                        <h3>${titlu}</h3>
                        <p><strong>Autor:</strong> ${autor}</p>
                        <p class="pret">${pret} RON</p>
                    </div>
                    <button onclick="addToCart('${id}', '${titluEscapat}', ${pret}, '${imageName}')">Adaugă în coș</button>
                </div>
            `;
            recomandateContainer.appendChild(card);
        }
    } catch (error) {
        console.error("Eroare la încărcarea produselor recomandate:", error);
        const recomandateContainer = document.getElementById('recomandate-container');
        if (recomandateContainer) {
            recomandateContainer.innerHTML = `<p style="color: red; font-weight: bold;">Recomandările nu pot fi afișate.<br> Motiv: ${error.message}</p>`;
        }
    }
}

// --- Functii pentru Citirea Zilei (Tarot) ---
const tarotDeck = [ // Asigura-te ca numele fisierelor imagine sunt corecte aici
    { name: "Nebunul", image: "tarot-nebunul.jpg", interpretation: "Noi începuturi, spontaneitate, credință în viitor, inocență. Fii deschis la noi experiențe și ai încredere în intuiția ta." },
    { name: "Magicianul", image: "tarot-magicianul.jpg", interpretation: "Putere, abilitate, concentrare, manifestare. Ai toate resursele necesare pentru a-ți atinge obiectivele. Folosește-ți talentele." },
    { name: "Marea Preoteasă", image: "tarot-marea-preoteasa.jpg", interpretation: "Intuiție, secrete, mister, subconștient. Ascultă-ți vocea interioară și fii atent la visele și premonițiile tale." },
    { name: "Împărăteasa", image: "tarot-imparateasa.jpg", interpretation: "Fertilitate, abundență, natură, grijă. Este un moment de creștere și creativitate. Îngrijește-te de tine și de cei dragi." },
    { name: "Împăratul", image: "tarot-imparatul.jpg", interpretation: "Autoritate, structură, control, paternitate. Stabilește ordine și disciplină în viața ta. Asumă-ți responsabilitatea." },
    { name: "Marele Preot", image: "tarot-marele-preot.jpg", interpretation: "Tradiție, conformism, învățătură. Caută îndrumare și respectă valorile consacrate." },
    { name: "Îndrăgostiții", image: "tarot-indragostitii.jpg", interpretation: "Relații, alegeri, armonie. Decizii importante legate de parteneriate și valori personale." },
    { name: "Faetonul", image: "tarot-faetonul.jpg", interpretation: "Control, voință, victorie. Mergi înainte cu încredere și depășește obstacolele." },
    { name: "Puterea", image: "tarot-puterea.jpg", interpretation: "Forță interioară, curaj, compasiune. Abordează provocările cu blândețe și stăpânire de sine." },
    { name: "Eremitul", image: "tarot-eremitul.jpg", interpretation: "Retragere, introspecție, înțelepciune. Caută răspunsuri în interiorul tău." }
    // Adauga si alte carti daca doresti
];

function displayRandomTarotCard() {
    const randomIndex = Math.floor(Math.random() * tarotDeck.length);
    const card = tarotDeck[randomIndex];
    const displayArea = document.getElementById('tarot-card-display');

    if (displayArea) { // Verificam daca elementul exista
        displayArea.innerHTML = `
            <img src="images/${card.image}" alt="${card.name}" onerror="this.onerror=null;this.src='images/default-tarot-card.jpg';"> <!-- Imagine fallback si pt tarot -->
            <h3>${card.name}</h3>
            <p>${card.interpretation}</p>
        `;
        displayArea.style.display = 'flex';
    } else {
        console.error("Elementul #tarot-card-display nu a fost gasit.");
    }
}

// --- Functii pentru Cosul de Cumparaturi ---
function renderCart() {
    const cartItemsContainer = document.getElementById('cos-items-body');
    const cosSummaryContainer = document.getElementById('cos-summary');
    const checkoutButtonContainer = document.querySelector('.checkout-button-container');

    if (!cartItemsContainer) return; // Iesim daca nu suntem pe pagina cosului

    let cart = JSON.parse(localStorage.getItem('arcantiaCart')) || [];
    cartItemsContainer.innerHTML = ''; 

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<tr><td colspan="5" style="text-align:center;">Coșul tău este gol.</td></tr>';
        if (cosSummaryContainer) cosSummaryContainer.innerHTML = '<p>Total: 0.00 RON</p>';
        if (checkoutButtonContainer) checkoutButtonContainer.innerHTML = '';
        return;
    }

    let subtotal = 0;
    cart.forEach(item => {
        // Asiguram ca item.pret este un numar inainte de a-l multiplica
        const itemPrice = parseFloat(item.pret) || 0;
        const itemQuantity = parseInt(item.quantity, 10) || 0;
        const itemTotal = itemPrice * itemQuantity;
        subtotal += itemTotal;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><img src="${item.imagine}" alt="${item.nume}" class="cart-item-image" onerror="this.onerror=null;this.src='images/default-book-cover.jpg';"> ${item.nume}</td>
            <td>${itemPrice.toFixed(2)} RON</td>
            <td class="item-quantity">
                <input type="number" value="${itemQuantity}" min="1" onchange="updateCartItemQuantity('${item.id}', this.value)">
            </td>
            <td>${itemTotal.toFixed(2)} RON</td>
            <td><button onclick="removeFromCart('${item.id}')" style="background: #5c3b80; font-size:0.9em; padding: 8px 15px;">Șterge</button></td>
        `;
        cartItemsContainer.appendChild(tr);
    });

    if (cosSummaryContainer) {
        cosSummaryContainer.innerHTML = `
            <p>Subtotal: ${subtotal.toFixed(2)} RON</p>
            <h3>Total: ${subtotal.toFixed(2)} RON</h3>
        `;
    }
    if (checkoutButtonContainer) {
         checkoutButtonContainer.innerHTML = `<button class="button-link">Finalizează Comanda</button>`;
    }
}

function updateCartItemQuantity(itemId, newQuantity) {
    let cart = JSON.parse(localStorage.getItem('arcantiaCart')) || [];
    const itemIndex = cart.findIndex(item => item.id === itemId);
    newQuantity = parseInt(newQuantity, 10);

    if (itemIndex > -1 && newQuantity > 0) {
        cart[itemIndex].quantity = newQuantity;
    } else if (newQuantity <= 0 && itemIndex > -1) {
        cart.splice(itemIndex, 1); // Sterge itemul daca noua cantitate e 0 sau mai mica
    }

    localStorage.setItem('arcantiaCart', JSON.stringify(cart));
    renderCart(); // Re-randeaza cosul
    updateCartCount(); // Actualizeaza si contorul din header
}

function removeFromCart(itemId) {
    let cart = JSON.parse(localStorage.getItem('arcantiaCart')) || [];
    cart = cart.filter(item => item.id !== itemId);
    localStorage.setItem('arcantiaCart', JSON.stringify(cart));
    renderCart();
    updateCartCount();
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('arcantiaCart')) || [];
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        const totalItems = cart.reduce((total, item) => total + (parseInt(item.quantity, 10) || 0), 0);
        cartCountElement.textContent = totalItems;
    }
}