const backgroundLayer = document.getElementById("background-layer");
const toggleBackgroundsBtn = document.getElementById("toggle-backgrounds-btn");
const backgroundsContainer = document.getElementById("backgrounds-container");
const backgroundTemplate = document.getElementById("background-template");
const addBackgroundButton = document.getElementById("add-background-button");

function setBackground(url, theme) {
    backgroundLayer.style.backgroundImage = `url(${url})`;
    document.querySelector(':root').style.setProperty("--color-value", `${theme === "black" ? 0 : 255}`);
}

async function pickRandomBackground() {
    const backgrounds = (await chrome.storage.local.get("backgrounds"))["backgrounds"] ?? [];
    if (backgrounds.length === 0) {
        setBackground("https://i.imgur.com/xJ92icr.png", "black");
        return;
    }

    const data = backgrounds[Math.floor(Math.random() * backgrounds.length)];
    setBackground((await chrome.storage.local.get(data.uu))[data.uu], data.theme);
}

async function createBackgroundNode(uu, theme) {
    const res = document.importNode(backgroundTemplate.content, true);
    const url = (await chrome.storage.local.get(uu))[uu];

    const card = res.querySelector(".background-card");
    card.id = uu;
    card.addEventListener("click", () => {
        setBackground(url, theme);
    });

    const thumb = res.querySelector(".background-thumb");
    thumb.src = url;
    thumb.alt = `background ${uu}`;

    const edit = res.querySelector(".background-edit");
    edit.addEventListener("click", (e) => {
        e.stopPropagation();
        showBackgroundModal(uu, url, theme);
    });

    return res;
}

async function addBackground(url, theme) {
    // update storage
    const backgrounds = (await chrome.storage.local.get("backgrounds"))["backgrounds"] ?? [];
    const uu = window.crypto.randomUUID();
    backgrounds.push({theme, uu});
    await chrome.storage.local.set({backgrounds, [uu]: url});

    // update page
    backgroundsContainer.insertBefore(await createBackgroundNode(uu, theme), addBackgroundButton);
    setBackground(url, theme);
}

async function editBackground(uu, url, theme) {
    // update storage
    const backgrounds = (await chrome.storage.local.get("backgrounds"))["backgrounds"] ?? [];
    const index = backgrounds.findIndex((d) => {
        return d.uu === uu;
    });
    backgrounds[index] = {theme, uu};
    await chrome.storage.local.set({backgrounds, [uu]: url});

    // update page
    const curThumb = document.getElementById(uu);
    const next = curThumb.nextSibling;
    curThumb.remove();
    backgroundsContainer.insertBefore(await createBackgroundNode(uu, theme), next);
    setBackground(url, theme);
}

async function deleteBackground(uu) {
    // update storage
    const backgrounds = (await chrome.storage.local.get("backgrounds"))["backgrounds"] ?? [];
    const newBackgrounds = backgrounds.filter((d) => {
        return d.uu !== uu;
    });
    await chrome.storage.local.set({backgrounds: newBackgrounds});
    await chrome.storage.local.remove(uu);

    // update page
    const curThumb = document.getElementById(uu);
    curThumb.remove();
    await pickRandomBackground();
}

function showBackgroundModal(uu, url, theme) {
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.innerHTML = `
        <form class="modal-content">
            <div class="modal-title">
                <h2>${uu ? "Edit" : "Add"} Background</h2>
            </div>
            <div class="modal-section">
                <h3>URL</h3>
                <input type="url" id="background-url-input"
                       placeholder="https://i.imgur.com/xJ92icr.png" value="${uu ? url : ""}" />
                       <br><br>
                <h3>Image</h3>
                <input type="file" accept="image/*" id="background-image-input"/>
            </div>
            <div class="modal-section">
                <h3>Text color</h3>
                <div class="stick-left">
                    <label>
                        <input type="radio" name="theme" value="black"
                               ${!uu || theme === "black" ? "checked" : ""}>
                        Black
                    </label>
                    <label>
                        <input type="radio" name="theme" value="white" 
                               ${uu && theme !== "black" ? "checked" : ""}>
                        White
                    </label>
                </div>
            </div>
            <div class="modal-actions">
                <div class="stick-left">
                    ${uu ? `<button id="delete-background" class="modal-button red" type="button">Delete</button>` : ""}
                </div>
                <div class="stick-right">
                    <button id="cancel-background" class="modal-button blue" type="button">Cancel</button>
                    <button id="save-background" class="modal-button green" type="submit">Save</button>
                </div>
            </div>
        </form>`;
    document.body.appendChild(modal);


    modal.querySelector("#cancel-background").addEventListener("click", () => {
        modal.remove();
    });

    modal.querySelector("form").addEventListener("submit", (e) => {
        e.preventDefault();
        const url = modal.querySelector("#background-url-input").value.trim();
        const theme = modal.querySelector('input[name="theme"]:checked').value;
        const image = modal.querySelector("#background-image-input").files[0];


        const reader = new FileReader();

        reader.addEventListener("load", () => {
            const url = reader.result;

            if (uu) {
                editBackground(uu, url, theme);
            } else {
                addBackground(url, theme);
            }
            modal.remove();
        });

        if (image) {
            reader.readAsDataURL(image);
            return;
        }

        if (!url) {
            alert("Please enter a URL!");
            return;
        }

        if (uu) {
            editBackground(uu, url, theme);
        } else {
            addBackground(url, theme);
        }
        modal.remove();
    });

    if (uu) {
        modal.querySelector("#delete-background").addEventListener("click", () => {
            deleteBackground(uu);
            modal.remove();
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

    modal.querySelector("#background-url-input").focus();
}

async function startUp() {
    await pickRandomBackground();

    const backgrounds = (await chrome.storage.local.get("backgrounds"))["backgrounds"] ?? [];
    for (let {uu, theme} of backgrounds) {
        backgroundsContainer.insertBefore(await createBackgroundNode(uu, theme), addBackgroundButton);
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
