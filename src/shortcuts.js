const shortcutsContainer = document.getElementById("shortcuts-container");
const shortcutTemplate = document.getElementById("shortcut-template");
const addShortcutButton = document.getElementById("add-shortcut-button");

function createShortcutNode(uu, url, name) {
    const res = document.importNode(shortcutTemplate.content, true);

    const link = res.querySelector("a");
    link.href = url;
    link.id = uu;

    const label = res.querySelector(".shortcut-label");
    label.innerText = name;

    const icon = res.querySelector(".shortcut-icon");
    icon.src = `https://www.google.com/s2/favicons?domain=${url}&sz=128`;
    icon.alt = `favicon for ${name}`;

    const edit = res.querySelector(".shortcut-edit");
    edit.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        showShortcutModal(uu, url, name);
    });

    return res;
}

async function addShortcut(url, name) {
    // update storage
    const shortcuts = (await chrome.storage.local.get("shortcuts"))["shortcuts"] ?? [];
    const uu = window.crypto.randomUUID();
    shortcuts.push({url, name, uu});
    await chrome.storage.local.set({shortcuts});

    // update page
    shortcutsContainer.insertBefore(createShortcutNode(uu, url, name), addShortcutButton);
}

async function editShortcut(uu, url, name) {
    // update storage
    const shortcuts = (await chrome.storage.local.get("shortcuts"))["shortcuts"] ?? [];
    const index = shortcuts.findIndex((s) => {
        return s.uu === uu;
    });
    shortcuts[index] = {url, name, uu};
    await chrome.storage.local.set({shortcuts});

    // update page
    const curLink = document.getElementById(uu);
    const next = curLink.nextSibling;
    curLink.remove();
    shortcutsContainer.insertBefore(createShortcutNode(uu, url, name), next);
}

async function deleteShortcut(uu) {
    // update storage
    const shortcuts = (await chrome.storage.local.get("shortcuts"))["shortcuts"] ?? [];
    const newShortcuts = shortcuts.filter((s) => {
        return s.uu !== uu;
    });
    await chrome.storage.local.set({shortcuts: newShortcuts});

    // update page
    const curLink = document.getElementById(uu);
    curLink.remove();
}

function showShortcutModal(uu, url, name) {
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.innerHTML = `
        <form class="modal-content">
            <div class="modal-title">
                <h2>${uu ? "Edit" : "Add"} Shortcut</h2>
            </div>
            <div class="modal-section">
                <h3>Name</h3>
                <input type="text" id="shortcut-name"
                       placeholder="Awesome shortcut" value="${uu ? name : ""}" />
            </div>
            <div class="modal-section">
                <h3>URL</h3>
                <input type="url" id="shortcut-url"
                       placeholder="https://github.com/Nounours0261" value="${uu ? url : ""}" />
            </div>
            <div class="modal-actions">
                <div class="stick-left">
                    ${uu ? `<button id="delete-shortcut" class="modal-button red" 
                    type="button">Delete</button>` : ""}
                </div>
                <div class="stick-right">
                    <button id="cancel-shortcut" class="modal-button blue" type="button">Cancel</button>
                    <button id="save-shortcut" class="modal-button green" type="submit">Save</button>
                </div>
            </div>
        </form>`;
    document.body.appendChild(modal);


    modal.querySelector("form").addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.getElementById("shortcut-name").value.trim();
        const url = document.getElementById("shortcut-url").value.trim();

        if (!name || !url) {
            alert("Please fill in both fields!");
            return;
        }

        if (uu) {
            editShortcut(uu, url, name);
        } else {
            addShortcut(url, name);
        }

        removeModal();
    });

    modal.querySelector("#cancel-shortcut").addEventListener("click", removeModal);

    if (uu) {
        modal.querySelector("#delete-shortcut").addEventListener("click", () => {
            deleteShortcut(uu);
            removeModal();
        });
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

    modal.querySelector("#shortcut-name").focus();
}

async function startUp() {
    const shortcuts = (await chrome.storage.local.get("shortcuts"))["shortcuts"] ?? [];
    shortcuts.forEach(({uu, url, name}) => {
        shortcutsContainer.insertBefore(createShortcutNode(uu, url, name), addShortcutButton);
    });

    addShortcutButton.addEventListener("click", (e) => {
        e.stopPropagation();
        showShortcutModal();
    });
}

document.addEventListener("DOMContentLoaded", startUp);
