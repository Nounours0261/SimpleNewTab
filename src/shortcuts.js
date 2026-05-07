const shortcutsContainer = document.getElementById("shortcuts-container");
const shortcutTemplate = document.getElementById("shortcut-template");
const addShortcutButton = document.getElementById("add-shortcut-button");
const modalTemplate = document.getElementById("shortcut-modal");

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
    const node = document.importNode(modalTemplate.content, true);
    document.body.appendChild(node);
    const modal = document.querySelector(".modal");

    const title = modal.querySelector(".modal-title");
    title.innerText = `${uu ? "Edit" : "Add"} Shortcut`;

    const nameInput = document.getElementById("shortcut-name");

    if (uu) {
        nameInput.value = name;

        const urlInput = document.getElementById("shortcut-url");
        urlInput.value = url;

        const deleteButton = document.getElementById("delete-shortcut");
        deleteButton.classList.add("visible");
        deleteButton.addEventListener("click", () => {
            deleteShortcut(uu);
            removeModal();
        });
    }

    modal.addEventListener("mousedown", (e) => {
        if (e.target === modal) {
            removeModal();
        }
    });

    const cancel = document.getElementById("cancel-shortcut");
    cancel.addEventListener("click", () => {
        removeModal();
    });

    modal.querySelector("form").addEventListener("submit", (e) => {
        e.preventDefault();

        const formData = new FormData(modal.querySelector(".modal-content"));
        const newUrl = formData.get("url");
        const newName = formData.get("name");

        if (uu) {
            editShortcut(uu, newUrl, newName);
        } else {
            addShortcut(newUrl, newName);
        }

        removeModal();
    });

    function removeModal() {
        modal.remove();
        window.removeEventListener("keydown", checkKey);
    }

    function checkKey(e) {
        if (e.key === "Escape") {
            removeModal();
        }
    }

    document.addEventListener("keydown", checkKey);

    nameInput.focus();
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
