(() => {
  const form = document.getElementById("demo-form");
  const result = document.getElementById("result");
  const inputId = document.getElementById("payment-id");
  const inputAmount = document.getElementById("payment-amount");
  if (!form || !result || !inputId || !inputAmount) return;

  const EXPECTED = { amount: 1, orderId: "order-42", uid: "demo-user" };
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const line = (ok, text) => {
    const li = document.createElement("li");
    const mark = document.createElement("span");
    mark.className = ok ? "ok" : "ko";
    mark.textContent = ok ? "✓" : "×";
    const label = document.createElement("span");
    label.textContent = text;
    li.append(mark, label);
    return li;
  };

  const render = (ok, rows) => {
    result.className = "result " + (ok ? "ok" : "ko");
    const list = document.createElement("ul");
    list.className = "result-list";
    rows.forEach(([passed, text]) => list.append(line(passed, text)));
    result.replaceChildren(list);
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const paymentId = inputId.value.trim();
    const amount = Number(inputAmount.value);
    const button = form.querySelector("button");
    const rows = [];

    button.disabled = true;
    button.textContent = "Vérification…";
    result.className = "result";
    result.replaceChildren(Object.assign(document.createElement("p"), {
      className: "result-empty",
      textContent: "Appel simulé à api.minepi.com…",
    }));

    await wait(450);

    const idOk = typeof paymentId === "string" && paymentId.length > 0 && /^[A-Za-z0-9_-]+$/.test(paymentId);
    rows.push([idOk, idOk ? "paymentId valide" : "paymentId manquant ou invalide"]);

    await wait(250);
    rows.push([true, "approve Pi simulé : 200 OK (idempotent)"]);

    const amountOk = Number.isFinite(amount) && Math.abs(amount - EXPECTED.amount) < 0.005;
    rows.push([amountOk, amountOk
      ? "montant conforme à la commande (" + EXPECTED.amount.toFixed(2) + " π)"
      : "montant " + (Number.isFinite(amount) ? amount : "?") + " π ≠ attendu " + EXPECTED.amount.toFixed(2) + " π"]);

    rows.push([true, "orderId et uid relus en base, pas depuis le client"]);

    const ok = idOk && amountOk;
    if (ok) rows.push([true, "commande " + EXPECTED.orderId + " marquée approuvée"]);

    render(ok, rows);
    button.disabled = false;
    button.textContent = "Approuver";
  });
})();
