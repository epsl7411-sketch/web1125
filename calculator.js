const DAILY_RATE = 25000;
const LODGING_CAPS = { seoul: 100000, metro: 80000, other: 70000 };
const EFFECTIVE_DATE = "2026-10-02";

function tripLength(departure, returnDate) {
  if (!departure || !returnDate) return 0;
  const elapsed = Date.parse(returnDate + "T00:00:00Z") - Date.parse(departure + "T00:00:00Z");
  return elapsed / 86400000 + 1;
}

function money(amount) {
  return amount.toLocaleString("ko-KR") + "원";
}

function lodgingLimit(grade, region, extra) {
  if (grade !== "2") return Infinity;
  const cap = LODGING_CAPS[region];
  return extra ? cap * 13 / 10 : cap;
}

function longStayDeduction(days) {
  // The thresholds count from the day after arrival. Each tier adds 10 percentage points.
  return [15, 30, 60].reduce((deduction, threshold) => (
    deduction + Math.max(0, days - 1 - threshold) * DAILY_RATE / 10
  ), 0);
}

function calculateTrip(trip) {
  const days = tripLength(trip.departure, trip.returnDate);
  if (!Number.isInteger(days) || days < 1) throw new Error("복귀일은 출장일과 같거나 이후여야 합니다.");
  if (trip.type === "inside") {
    if (days !== 1) throw new Error("근무지 내 출장은 출장일과 복귀일을 같은 날짜로 입력하세요.");
    const base = trip.minutes >= 240 ? 20000 : 10000;
    const deduction = { none: 0, official: 10000, assigned: base }[trip.insideVehicle];
    return [{
      label: "근무지 내 출장 여비",
      amount: base - deduction,
      note: trip.minutes + "분 · 기본 " + money(base) + (deduction ? " · 감액 " + money(deduction) : "")
    }];
  }

  const { eligibleDays, halfDays, noMealDays, mileageDays, mileageSavings, grade, longStay } = trip;
  if (eligibleDays > days) throw new Error("지급 대상 여행일수는 전체 출장 기간을 넘길 수 없습니다.");
  if (Math.max(halfDays, noMealDays, mileageDays) > eligibleDays) {
    throw new Error("감액 또는 추가 지급 대상 일수는 지급 대상 여행일수를 넘길 수 없습니다.");
  }
  if (longStay && eligibleDays !== days) {
    throw new Error("연속 장기체재를 선택한 경우에는 전체 출장 기간이 지급 대상이어야 합니다.");
  }
  const stayDeduction = longStay ? longStayDeduction(days) : 0;
  if (stayDeduction && halfDays) {
    throw new Error("장기체재와 일비 50% 감액을 함께 적용할 때는 소속 기관에 지급액을 확인하세요.");
  }
  if (Boolean(mileageDays) !== Boolean(mileageSavings)) {
    throw new Error("공적 마일리지 추가 지급을 계산하려면 대상 일수와 절감액을 모두 입력하세요.");
  }
  if (mileageDays && (halfDays || stayDeduction)) {
    throw new Error("마일리지 추가 지급과 일비 감액을 함께 적용할 때는 소속 기관에 지급액을 확인하세요.");
  }
  const mileage = Math.min(mileageDays * DAILY_RATE / 2, mileageSavings);
  const nights = trip.lodging.reduce((sum, row) => sum + row.nights, 0);
  if (nights >= days) throw new Error("숙박 박수 합계는 전체 출장 기간에서 1일을 뺀 값 이하여야 합니다.");

  const transport = trip.transport.reduce((sum, row) => sum + (row.kind === "official" ? 0 : row.fare), 0);
  const lodging = trip.lodging.reduce((sum, row) => (
    sum + row.nights * Math.min(row.price, lodgingLimit(grade, row.region, row.extra))
  ), 0);
  const lodgingPaid = trip.lodging.reduce((sum, row) => sum + row.nights * row.price, 0);
  const actual = grade === "actual";
  const daily = actual ? trip.actualDaily : eligibleDays * DAILY_RATE - halfDays * DAILY_RATE / 2 - stayDeduction;
  const meals = actual ? trip.actualMeals : (eligibleDays - noMealDays) * DAILY_RATE;

  const rows = [
    {
      label: "일비", amount: daily,
      note: actual ? "입력한 실비" : [
        money(DAILY_RATE) + " × " + eligibleDays + "일",
        halfDays ? "50% 감액 " + halfDays + "일" : "",
        stayDeduction ? "장기체재 감액 " + money(stayDeduction) : ""
      ].filter(Boolean).join(" · ")
    },
    {
      label: "식비", amount: meals,
      note: actual ? "입력한 실비" : [
        money(DAILY_RATE) + " × " + (eligibleDays - noMealDays) + "일",
        noMealDays ? "미지급 " + noMealDays + "일" : ""
      ].filter(Boolean).join(" · ")
    },
    {
      label: "교통비", amount: transport,
      note: trip.transport.length ? "입력한 교통편 " + trip.transport.length + "건" : "입력한 교통편 없음"
    },
    {
      label: "숙박비", amount: lodging,
      note: nights ? nights + "박 · 결제액 " + money(lodgingPaid) +
        (lodging < lodgingPaid ? " · 상한 초과 " + money(lodgingPaid - lodging) : "") : "입력한 숙박 없음"
    }
  ];
  if (mileage) rows.push({ label: "공적 마일리지 추가 일비", amount: mileage, note: "항공운임 절감액 " + money(mileageSavings) });
  if (!Number.isSafeInteger(rows.reduce((sum, row) => sum + row.amount, 0)) || !Number.isSafeInteger(lodgingPaid)) {
    throw new Error("입력한 금액이 계산 범위를 넘습니다. 금액을 확인하세요.");
  }
  return rows;
}
