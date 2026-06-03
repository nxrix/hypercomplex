import { groups } from "./tables.js";

const groupsSorted = groups.slice().sort((a,b)=>a.length-b.length);

for (let i = 0; i < 6; i++) {
  const orow = document.createElement("tr");
  for (let j = 0; j < 4; j++) {
    const groupIndex = i * 4 + j;
    const cell = document.createElement("td");
    cell.style.padding = "4px";
    const groupData = groupsSorted[groupIndex];
    const div = document.createElement("div");
    div.style.outline = "1px solid var(--c3)";
    div.style.padding = "8px";
    div.style.borderRadius = "8px";
    div.style.display = "flex";
    div.style.flexDirection = "column";
    div.style.alignItems = "stretch";

    const n = groups.indexOf(groupData);
    const s = [0,1,2,3,26,27].includes(groupData[0]);

    const img = document.createElement("div");
    img.style.width = "100%";
    img.style.aspectRatio = "1";
    img.style.background = "url(./assets/img/sheet_bw_0.webp)";
    img.style.backgroundPosition = `0% calc(100%/23*${n})`;
    img.style.backgroundSize = "100% 2400%";
    if (s) img.style.filter = "sepia(1) saturate(3) hue-rotate(225deg)";
    img.style.marginBottom = "8px";
    div.appendChild(img);
    const header = document.createElement("div");
    header.textContent = `n${n+1}`+(s?" - s":"");
    header.style.textAlign = "center";
    div.appendChild(header);
    const hr = document.createElement("hr");
    hr.style.margin = "8px 0";
    hr.style.padding = "0";
    div.appendChild(hr);

    const itable = document.createElement("table");
    for (let k = 0; k < 8; k++) {
      const irow = document.createElement("tr");
      for (let m = 0; m < 4; m++) {
        const index = k * 4 + m;
        if (index<groupData.length) {
          const icell = document.createElement("td");
          icell.textContent = groupData[index];
          icell.style.padding = "0 4px";
          irow.appendChild(icell);
        }
      }
      if (irow.children.length > 0) itable.appendChild(irow);
    }
    div.appendChild(itable);
    cell.appendChild(div);
    orow.appendChild(cell);
  }
  table.appendChild(orow);
}

const rows = table.querySelectorAll("tr");
rows.forEach(row => {
  const cells = Array.from(row.children);
  let max = 0;
  cells.forEach(td => {
    const div = td.querySelector("div");
    if (div) {
      div.style.height = "0px";
      max = Math.max(max,div.scrollHeight);
    }
  });
  cells.forEach(td => {
    const div = td.querySelector("div");
    if (div) div.style.height = max+"px";
  });
});
