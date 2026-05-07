const backgroundLayer = document.getElementById("background-layer");
const toggleBackgroundsBtn = document.getElementById("toggle-backgrounds-btn");
const backgroundsContainer = document.getElementById("backgrounds-container");
const backgroundTemplate = document.getElementById("background-template");
const addBackgroundButton = document.getElementById("add-background-button");
const modalTemplate = document.getElementById("background-modal");

function setBackground({url, theme}) {
    backgroundLayer.style.backgroundImage = `url(${url})`;
    document.querySelector(':root').style.setProperty("--color-value", `${theme === "black" ? 0 : 255}`);
}

async function pickRandomBackground() {
    const backgrounds = (await chrome.storage.local.get("backgrounds"))["backgrounds"] ?? [];
    if (backgrounds.length === 0) {
        setBackground({url: "https://i.imgur.com/xJ92icr.png", theme: "black"});
        return;
    }

    const uu = backgrounds[Math.floor(Math.random() * backgrounds.length)];
    setBackground((await chrome.storage.local.get(uu))[uu]);
}

async function createBackgroundNode(uu) {
    const res = document.importNode(backgroundTemplate.content, true);
    const data = (await chrome.storage.local.get(uu))[uu];

    const card = res.querySelector(".background-card");
    card.id = uu;
    card.addEventListener("click", async () => {
        setBackground(data);
    });

    const thumb = res.querySelector(".background-thumb");
    thumb.src = data.url;
    thumb.alt = `background ${uu}`;

    const edit = res.querySelector(".background-edit");
    edit.addEventListener("click", (e) => {
        e.stopPropagation();
        showBackgroundModal(uu, data.url, data.theme);
    });

    return res;
}

async function addBackground(url, theme) {
    // update storage
    const backgrounds = (await chrome.storage.local.get("backgrounds"))["backgrounds"] ?? [];
    const uu = window.crypto.randomUUID();
    backgrounds.push(uu);
    await chrome.storage.local.set({backgrounds, [uu]: {url, theme}});

    // update page
    backgroundsContainer.insertBefore(await createBackgroundNode(uu), addBackgroundButton);
    setBackground({url, theme});
}

async function editBackground(uu, url, theme) {
    // update storage
    const backgrounds = (await chrome.storage.local.get("backgrounds"))["backgrounds"] ?? [];
    const index = backgrounds.findIndex((d) => {
        return d === uu;
    });
    backgrounds[index] = uu;
    await chrome.storage.local.set({backgrounds, [uu]: {url, theme}});

    // update page
    const newBackground = await createBackgroundNode(uu);
    const curThumb = document.getElementById(uu);
    const next = curThumb.nextSibling;
    curThumb.remove();
    backgroundsContainer.insertBefore(newBackground, next);
    setBackground({url, theme});
}

async function deleteBackground(uu) {
    // update storage
    const backgrounds = (await chrome.storage.local.get("backgrounds"))["backgrounds"] ?? [];
    const newBackgrounds = backgrounds.filter((d) => {
        return d !== uu;
    });
    await chrome.storage.local.set({backgrounds: newBackgrounds});
    await chrome.storage.local.remove(uu);

    // update page
    const curThumb = document.getElementById(uu);
    curThumb.remove();
    await pickRandomBackground();
}

async function showBackgroundModal(uu, url, theme) {
    const node = document.importNode(modalTemplate.content, true);
    document.body.appendChild(node);

    const modal = document.querySelector(".modal");

    const title = modal.querySelector(".modal-title");
    title.innerText = `${uu ? "Edit" : "Add"} Background`;

    const urlInput = document.getElementById("background-url-input");

    if (uu) {
        urlInput.value = url;

        if (theme === "white") {
            const whiteButton = modal.querySelector(`[type="radio"][value="white"]`);
            whiteButton.toggleAttribute("checked");
            const blackButton = modal.querySelector(`[type="radio"][value="black"]`);
            blackButton.toggleAttribute("checked");
        }

        const deleteButton = document.getElementById("delete-background");
        deleteButton.classList.add("visible");
        deleteButton.addEventListener("click", () => {
            deleteBackground(uu);
            removeModal();
        });
    }

    modal.addEventListener("mousedown", (e) => {
        if (e.target === modal) {
            removeModal();
        }
    });

    const cancel = document.getElementById("cancel-background");
    cancel.addEventListener("click", () => {
        removeModal();
    });

    const imageInput = document.getElementById("background-image-input");
    imageInput.addEventListener("change", (e) => {
        const reader = new FileReader();

        reader.addEventListener("load", () => {
            urlInput.value = reader.result;
            imageInput.value = null;
        });

        reader.readAsDataURL(e.target.files[0]);
    });


    modal.querySelector("form").addEventListener("submit", (e) => {
        e.preventDefault();

        const formData = new FormData(modal.querySelector(".modal-content"));
        const newUrl = formData.get("url");
        const newTheme = modal.querySelector('input[name="theme"]:checked').value;

        if (uu) {
            editBackground(uu, newUrl, newTheme);
        } else {
            addBackground(newUrl, newTheme);
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

    urlInput.focus();
}

async function startUp() {
    await pickRandomBackground();

    const backgrounds = (await chrome.storage.local.get("backgrounds"))["backgrounds"] ?? [];
    for (let uu of backgrounds) {
        backgroundsContainer.insertBefore(await createBackgroundNode(uu), addBackgroundButton);
    }

    toggleBackgroundsBtn.addEventListener("click", () => {
        backgroundsContainer.classList.toggle("visible");
    });

    addBackgroundButton.addEventListener("click", (e) => {
        e.stopPropagation();
        showBackgroundModal();
    });
}

document.addEventListener("DOMContentLoaded", startUp);
