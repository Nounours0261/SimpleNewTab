const toggleBackgroundsBtn = document.getElementById("toggle-backgrounds-btn");
const backgroundsContainer = document.getElementById("backgrounds-container");
const shortcutsContainer = document.getElementById("shortcuts-container");
const backgroundLayer = document.getElementById("background-layer");

function addShortcut(data) {
    chrome.storage.sync.get(["shortcuts"], (result) => {
        const shortcuts = result.shortcuts || [];
        shortcuts.push(data);
        chrome.storage.sync.set({shortcuts}, () => {
            renderShortcuts();
        });
    });
}

function editShortcut(data, index) {
    chrome.storage.sync.get(["shortcuts"], (result) => {
        const shortcuts = result.shortcuts;
        shortcuts[index] = data;
        chrome.storage.sync.set({shortcuts}, () => {
            renderShortcuts();
        });
    });
}

function deleteShortcut(indexToRemove) {
    chrome.storage.sync.get(["shortcuts"], (result) => {
        let shortcuts = result.shortcuts;
        shortcuts.splice(indexToRemove, 1);

        chrome.storage.sync.set({shortcuts}, () => {
            renderShortcuts(shortcuts);
        });
    });
}

function showShortcutModal(data) {
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-title">
                <h2>${data ? "Edit" : "Add"} Shortcut</h2>
            </div>
            <div class="modal-section">
                <h3>Name</h3>
                <input type="text" id="shortcut-name"
                       placeholder="Awesome shortcut" value="${data ? data.name : ""}" />
            </div>
            <div class="modal-section">
                <h3>URL</h3>
                <input type="url" id="shortcut-url"
                       placeholder="https://github.com/Nounours0261" value="${data ? data.url : ""}" />
            </div>
            <div class="modal-actions">
                <div class="stick-left">
                    ${data ? `<button id="delete-shortcut" class="modal-button red">Delete</button>` : ""}
                </div>
                <div class="stick-right">
                    <button id="cancel-shortcut" class="modal-button blue">Cancel</button>
                    <button id="save-shortcut" class="modal-button green">Save</button>
                </div>
            </div>
        </div>`;
    document.body.appendChild(modal);


    modal.querySelector("#save-shortcut").addEventListener("click", () => {
        const name = document.getElementById("shortcut-name").value.trim();
        const url = document.getElementById("shortcut-url").value.trim();

        if (!name || !url) {
            alert("Please fill in both fields!");
            return;
        }

        if (data) {
            editShortcut({name, url}, data.index)
        } else {
            addShortcut({name, url});
        }

        removeModal();
    });

    modal.querySelector("#cancel-shortcut").addEventListener("click", removeModal);

    if (data) {
        modal.querySelector("#delete-shortcut").addEventListener("click", () => {
            deleteShortcut(data.index)
            removeModal();
        })
    }


    function removeModal() {
        modal.remove();
        document.removeEventListener("click", checkClick);
        document.removeEventListener("keydown", checkKey);
    }

    const modalContent = modal.querySelector(".modal-content");

    function checkClick(e) {
        if (!modalContent.contains(e.target)) {
            removeModal();
        }
    }

    document.addEventListener("click", checkClick);

    function checkKey(e) {
        if (e.key === "Escape") {
            removeModal();
        }
    }

    document.addEventListener("keydown", checkKey);
}

function renderShortcuts() {
    shortcutsContainer.innerHTML = "";

    chrome.storage.sync.get(["shortcuts"], (result) => {
        const shortcuts = result.shortcuts || [];

        shortcuts.forEach(({name, url}, index) => {
            const card = document.createElement("a");
            card.className = "shortcut-card";
            card.href = url;
            card.target = "_blank";
            card.innerHTML = `
                <div class="shortcut-edit"
                     title="Edit shortcut">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                      <circle cx="12" cy="5" r="2"/>
                      <circle cx="12" cy="12" r="2"/>
                      <circle cx="12" cy="19" r="2"/>
                    </svg>
                </div>
                <div class="content-wrapper">
                    <img class="shortcut-icon"
                         src="https://www.google.com/s2/favicons?domain=${url}&amp;sz=128"
                         alt="favicon for ${name}">
                    <div class="shortcut-label">${name}</div>
                </div>`;

            card.querySelector(".shortcut-edit").addEventListener("click", (e) => {
                e.stopPropagation();
                e.preventDefault();
                showShortcutModal({index, name, url});
            });

            shortcutsContainer.appendChild(card);
        });

        const addCard = document.createElement("div");
        addCard.className = "shortcut-card";
        addCard.title = "Add new shortcut";
        addCard.innerHTML = `
            <div class="content-wrapper">
                <svg width="48" height="48" viewBox="0 0 24 24"
                     fill="none" stroke="var(--text-color)" stroke-width="2"
                     stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="7" x2="12" y2="17"/>
                    <line x1="7" y1="12" x2="17" y2="12"/>
                </svg>
                <div class="shortcut-label">Add</div>
            </div>`;

        addCard.addEventListener("click", (e) => {
            e.stopPropagation()
            showShortcutModal();
        });

        shortcutsContainer.appendChild(addCard);
    });
}


function addBackground(data) {
    chrome.storage.sync.get(["backgrounds"], (result) => {
        const backgrounds = result.backgrounds || [];
        backgrounds.push(data);
        chrome.storage.sync.set({backgrounds}, () => {
            renderBackgrounds();
            setBackground(data);
        });
    });
}

function editBackground(data, index) {
    chrome.storage.sync.get(["backgrounds"], (result) => {
        const backgrounds = result.backgrounds;
        backgrounds[index] = data;
        chrome.storage.sync.set({backgrounds}, () => {
            renderBackgrounds();
            setBackground(data);
        });
    });
}

function deleteBackground(index) {
    chrome.storage.sync.get(["backgrounds"], (result) => {
        const backgrounds = result.backgrounds;
        backgrounds.splice(index, 1);
        chrome.storage.sync.set({backgrounds}, () => {
            renderBackgrounds();
            pickRandomBackground();
        });
    });
}

function showBackgroundModal(data) {
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-title">
                <h2>${data ? "Edit" : "Add"} Background</h2>
            </div>
            <div class="modal-section">
                <h3>URL</h3>
                <input type="url" id="background-url-input"
                       placeholder="https://i.imgur.com/KGmRV1z.png" value="${data ? data.url : ""}" />
            </div>
            <div class="modal-section">
                <h3>Text color</h3>
                <div class="stick-left">
                    <label>
                        <input type="radio" name="theme" value="black"
                               ${!data || data.theme === "black" ? "checked" : ""}>
                        Black
                    </label>
                    <label>
                        <input type="radio" name="theme" value="white" 
                               ${data && data.theme === "white" ? "checked" : ""}>
                        White
                    </label>
                </div>
            </div>
            <div class="modal-actions">
                <div class="stick-left">
                    ${data ? `<button id="delete-background" class="modal-button red">Delete</button>` : ""}
                </div>
                <div class="stick-right">
                    <button id="cancel-background" class="modal-button blue">Cancel</button>
                    <button id="save-background" class="modal-button green">Save</button>
                </div>
            </div>
        </div>`;
    document.body.appendChild(modal);


    modal.querySelector("#cancel-background").addEventListener("click", () => {
        modal.remove();
    });

    modal.querySelector("#save-background").addEventListener("click", () => {
        const url = modal.querySelector("#background-url-input").value.trim();
        const theme = modal.querySelector('input[name="theme"]:checked').value;

        if (!url) {
            alert("Please enter a URL!");
            return;
        }

        if (data) {
            editBackground({theme, url}, data.index)
        } else {
            addBackground({theme, url});
        }
        modal.remove();
    });

    if (data) {
        modal.querySelector("#delete-background").addEventListener("click", () => {
            deleteBackground(data.index)
            modal.remove();
        })
    }


    function removeModal() {
        modal.remove();
        document.removeEventListener("click", checkClick);
        document.removeEventListener("keydown", checkKey);
    }

    const modalContent = modal.querySelector(".modal-content");

    function checkClick(e) {
        if (!modalContent.contains(e.target)) {
            removeModal();
        }
    }

    document.addEventListener("click", checkClick);

    function checkKey(e) {
        if (e.key === "Escape") {
            removeModal();
        }
    }

    document.addEventListener("keydown", checkKey);
}

function pickRandomBackground() {
    chrome.storage.sync.get(["backgrounds"], (result) => {
        const backgrounds = result.backgrounds || [
            {
                url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1280&q=80",
                theme: "white"
            }
        ];
        setBackground(backgrounds[Math.floor(Math.random() * backgrounds.length)]);
    });
}

function setBackground({url, theme}) {
    backgroundLayer.style.backgroundImage = `url(${url})`;
    document.querySelector(':root').style.setProperty("--color-value", `${theme === "black" ? 0 : 255}`)
}

function renderBackgrounds() {
    backgroundsContainer.innerHTML = "";

    chrome.storage.sync.get(["backgrounds"], (result) => {
        const backgrounds = result.backgrounds || [];

        backgrounds.forEach(({url, theme}, index) => {
            const card = document.createElement("div");
            card.className = "background-card";
            card.innerHTML = `
                <img class="background-thumb"
                     src="${url}"
                     alt="Background ${index + 1}">
                <div class="background-edit"
                     title="Edit background">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                      <circle cx="12" cy="5" r="2"/>
                      <circle cx="12" cy="12" r="2"/>
                      <circle cx="12" cy="19" r="2"/>
                    </svg>
                </div>`;

            card.addEventListener("click", () => {
                setBackground({url, theme});
            })

            card.querySelector(".background-edit").addEventListener("click", (e) => {
                e.stopPropagation();
                showBackgroundModal({theme, url, index});
            });

            backgroundsContainer.appendChild(card);
        });

        const addCard = document.createElement("div");
        addCard.className = "add-background-card";
        addCard.title = "Add new background";
        addCard.innerHTML = `
            <svg width="40" height="40" viewBox="0 0 24 24"
                 fill="none" stroke="var(--text-color)" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="7" x2="12" y2="17"/>
                <line x1="7" y1="12" x2="17" y2="12"/>
            </svg>`;

        addCard.addEventListener("click", (e) => {
            e.stopPropagation();
            showBackgroundModal();
        });

        backgroundsContainer.appendChild(addCard);
    });
}


function startUp() {
    renderShortcuts();
    pickRandomBackground();
    renderBackgrounds();

    toggleBackgroundsBtn.addEventListener("click", () => {
        backgroundsContainer.classList.toggle("visible");
    });
}

document.addEventListener("DOMContentLoaded", startUp);
