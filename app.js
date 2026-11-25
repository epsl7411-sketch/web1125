const get = (id) => document.getElementById(id);
const form = get("trip-form");
const result = document.querySelector(".result");
const transportEntries = get("transport-entries");
const lodgingEntries = get("lodging-entries");
const inputValue = (id) => get(id).value;
const numberValue = (id) => Number(inputValue(id));
const isInside = () => form.elements["trip-type"].value === "inside";
let hasResult = false;
let currentResult = null;

const transportInstructions = {
  bus: "고시된 기준과 요율에 따른 버스요금 또는 해당 전철 실비를 입력하세요.",
  air: "지급 대상 등급의 항공운임을 입력하세요. 공적 마일리지를 사용했다면 사용 후 남은 항공운임을 입력하세요.",
  "car-standard": "지급 구분에 해당하는 철도운임 또는 버스운임을 입력하세요.",
  "car-expense": "기관의 지급 기준에 맞는 연료비·통행료 등의 합계를 입력하세요.",
  official: "공용 교통수단 이용 구간에는 운임을 지급하지 않습니다. 공무용 차량에 따른 일비 감액은 추가 조건에서 입력하세요."
};

function setGroup(id, enabled) {
  const group = get(id);
  group.hidden = !enabled;
  group.querySelectorAll("input, select, button").forEach((control) => { control.disabled = !enabled; });
}

function refreshEntries() {
  const grade = inputValue("grade");
  Array.from(transportEntries.children).forEach((entry, index) => {
    const kind = entry.querySelector(".kind").value;
    const fare = entry.querySelector(".fare");
    const official = kind === "official";
    entry.querySelector(".entry-title").textContent = "교통편 " + (index + 1);
    entry.querySelector(".remove").setAttribute("aria-label", "교통편 " + (index + 1) + " 삭제");
    entry.querySelector(".fare-label").hidden = official;
    fare.disabled = isInside() || official;
    fare.required = !official;
    let instruction = transportInstructions[kind];
    if (kind === "train") instruction = grade === "2" ? "일반실 기준 실비를 입력하세요." : "특실 기준 실비를 입력하세요.";
    if (kind === "ship") instruction = grade === "2" ? "2등급 기준 실비를 입력하세요." : "1등급 기준 실비를 입력하세요.";
    entry.querySelector(".transport-help").textContent = instruction;
  });
  Array.from(lodgingEntries.children).forEach((entry, index) => {
    const region = entry.querySelector(".region").value;
    const extra = entry.querySelector(".extra");
    const cap = lodgingLimit(grade, region, extra.checked);
    entry.querySelector(".entry-title").textContent = "숙박 " + (index + 1);
    entry.querySelector(".remove").setAttribute("aria-label", "숙박 " + (index + 1) + " 삭제");
    entry.querySelector(".lodging-extra").hidden = grade !== "2";
    extra.disabled = isInside() || grade !== "2";
    entry.querySelector(".lodging-help").textContent = cap === Infinity
      ? "할인 요금이 적용되면 할인 후 결제액을 입력하세요."
      : "1박 상한 " + money(cap) + (extra.checked ? " · 상한의 30% 추가 범위 포함" : "");
  });
}

function refreshForm() {
  const inside = isInside();
  const actual = inputValue("grade") === "actual";
  setGroup("inside-options", inside);
  setGroup("outside-options", !inside);
  setGroup("outside-expenses", !inside);
  setGroup("actual-options", !inside && actual);
  setGroup("adjustments", !inside && !actual);
  refreshEntries();
  const days = tripLength(inputValue("departure"), inputValue("return-date"));
  const hint = get("duration");
  hint.hidden = !(days > 0);
  hint.textContent = "전체 출장 기간 " + days + "일";
  get("return-date").min = inputValue("departure");
  get("eligible-days").max = days > 0 ? days : "";
  ["half-days", "no-meal-days", "mileage-days"].forEach((id) => {
    get(id).max = days > 0 ? numberValue("eligible-days") || days : "";
  });
}

function clearResult() {
  currentResult = null;
  get("form-error").hidden = true;
  get("result-actions").hidden = true;
  get("export-error").hidden = true;
  get("print-trip").textContent = "";
  get("breakdown").replaceChildren();
  get("total").textContent = "—";
  get("result-status").textContent = hasResult ? "입력값이 변경되었습니다. 다시 계산하세요." : "출장 정보를 입력하고 여비를 계산하세요.";
}

function addEntry(type, values = {}, focus = true) {
  const fragment = get(type + "-template").content.cloneNode(true);
  const entry = fragment.firstElementChild;
  for (const [field, value] of Object.entries(values)) {
    entry.querySelector("." + field).value = value;
  }
  const list = type === "transport" ? transportEntries : lodgingEntries;
  entry.querySelector(".remove").addEventListener("click", () => {
    const next = entry.nextElementSibling || entry.previousElementSibling;
    entry.remove();
    refreshForm();
    clearResult();
    (next?.querySelector(".remove") || get("add-" + type)).focus();
  });
  list.append(fragment);
  refreshForm();
  clearResult();
  if (focus) entry.querySelector("select").focus();
}

function readTrip() {
  const departure = inputValue("departure");
  const returnDate = inputValue("return-date");
  if (isInside()) {
    return { type: "inside", departure, returnDate, minutes: numberValue("minutes"), insideVehicle: inputValue("inside-vehicle") };
  }
  const grade = inputValue("grade");
  const actual = grade === "actual";
  return {
    type: "outside",
    departure, returnDate, grade,
    eligibleDays: numberValue("eligible-days") || tripLength(departure, returnDate),
    actualDaily: numberValue("actual-daily"),
    actualMeals: numberValue("actual-meals"),
    halfDays: actual ? 0 : numberValue("half-days"),
    noMealDays: actual ? 0 : numberValue("no-meal-days"),
    longStay: !actual && get("long-stay").checked,
    mileageDays: actual ? 0 : numberValue("mileage-days"),
    mileageSavings: actual ? 0 : numberValue("mileage-savings"),
    transport: Array.from(transportEntries.children, (entry) => ({
      kind: entry.querySelector(".kind").value,
      fare: Number(entry.querySelector(".fare").value)
    })),
    lodging: Array.from(lodgingEntries.children, (entry) => ({
      region: entry.querySelector(".region").value,
      nights: Number(entry.querySelector(".nights").value),
      price: Number(entry.querySelector(".price").value),
      extra: entry.querySelector(".extra").checked
    }))
  };
}

function showResult(trip, rows) {
  hasResult = true;
  const subtotal = rows.reduce((sum, row) => sum + row.amount, 0);
  get("total").textContent = money(subtotal);
  const summary = trip.type === "inside" ? "근무지 내 국내 출장" : "근무지 밖 국내 출장 · 지급 대상 " + trip.eligibleDays + "일";
  const status = summary + (trip.departure < EFFECTIVE_DATE ? " · 시행일 이전 날짜에 첨부 시행본 적용" : "");
  get("result-status").textContent = status;
  get("breakdown").replaceChildren(...rows.map((row) => {
    const line = document.createElement("div");
    line.className = "breakdown-row";
    const label = document.createElement("dt");
    label.textContent = row.label;
    const amount = document.createElement("dd");
    amount.textContent = money(row.amount);
    const note = document.createElement("dd");
    note.className = "breakdown-note";
    note.textContent = row.note;
    line.append(label, amount, note);
    return line;
  }));
  const dates = trip.departure === trip.returnDate ? trip.departure : trip.departure + " ~ " + trip.returnDate;
  const grade = trip.type === "outside" ? get("grade").selectedOptions[0].textContent : "";
  get("print-trip").textContent = "출장 기간 " + dates + (grade ? " · " + grade : "");
  currentResult = { departure: trip.departure, returnDate: trip.returnDate, grade, status, rows, subtotal };
  get("result-actions").hidden = false;
  if (matchMedia("(max-width: 830px)").matches) result.scrollIntoView({ block: "start" });
}

form.addEventListener("input", () => {
  refreshForm();
  clearResult();
});

form.addEventListener("invalid", (event) => {
  const details = event.target.closest("details");
  if (details) details.open = true;
}, true);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  clearResult();
  try {
    const trip = readTrip();
    showResult(trip, calculateTrip(trip));
  } catch (error) {
    get("form-error").hidden = false;
    get("form-error").textContent = error.message;
  }
});

form.addEventListener("reset", () => {
  transportEntries.replaceChildren();
  lodgingEntries.replaceChildren();
  get("adjustments").open = false;
  hasResult = false;
  clearResult();
  queueMicrotask(refreshForm);
});

get("add-transport").addEventListener("click", () => addEntry("transport"));
get("add-lodging").addEventListener("click", () => addEntry("lodging"));
const criteriaDialog = get("criteria-dialog");
get("open-criteria").addEventListener("click", () => {
  criteriaDialog.showModal();
  criteriaDialog.querySelector(".criteria-content").scrollTop = 0;
});
get("print-result").addEventListener("click", () => window.print());
get("export-excel").addEventListener("click", async (event) => {
  const snapshot = currentResult;
  if (!snapshot) return;
  const button = event.currentTarget;
  button.disabled = true;
  get("export-error").hidden = true;
  try {
    const workbook = await createExpenseWorkbook(snapshot);
    if (currentResult === snapshot) downloadExpenseWorkbook(workbook, snapshot);
  } catch {
    if (currentResult === snapshot) get("export-error").hidden = false;
  } finally {
    button.disabled = false;
  }
});
get("example").addEventListener("click", () => {
  form.reset();
  get("departure").value = "2026-11-25";
  get("return-date").value = "2026-11-27";
  addEntry("transport", { kind: "train", fare: 60000 }, false);
  addEntry("lodging", { region: "seoul", nights: 2, price: 110000 }, false);
  form.requestSubmit();
});

refreshForm();
