// Pricing calculator and quote handoff for the static Fit2Trade website.
(() => {
  const STORAGE_KEY = "fit2trade-pricing-quote";
  const PRICING_VERSION = "2026-08-19";

  const modules = {
    learn: { name: "Learn", unit: "employee", rate: 50, minimum: 6000 },
    ensure: { name: "Ensure", unit: "site", rate: 1200, minimum: 6000 },
    operate: { name: "Operate", unit: "site", rate: 600, minimum: 6000 },
    engage: { name: "Engage", unit: "site", rate: 120, minimum: 6000 },
    enclose: { name: "Enclose", unit: "site", rate: 120, minimum: 6000 },
    entry: { name: "Entry", unit: "site", rate: 120, minimum: 6000 },
    elevate: { name: "Elevate", unit: "employee", rate: 25, minimum: 6000, addOn: true },
  };

  const euro = new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });

  const buildReference = () => {
    const now = new Date();
    const date = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("");
    let suffix = "";
    if (window.crypto?.getRandomValues) {
      const values = new Uint32Array(2);
      window.crypto.getRandomValues(values);
      suffix = Array.from(values, (value) => value.toString(36).slice(-3).toUpperCase()).join("");
    } else {
      suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
    }
    return `F2T-${date}-${suffix.slice(0, 6)}`;
  };

  const calculateQuote = (employees, sites, selectedModules, reference = buildReference()) => {
    const lines = selectedModules.map((key) => {
      const item = modules[key];
      const quantity = item.unit === "employee" ? employees : sites;
      const calculated = quantity * item.rate;
      const amount = Math.max(calculated, item.minimum || 0);
      return { key, name: item.name, amount, minimumApplied: amount > calculated };
    });

    return {
      version: PRICING_VERSION,
      reference,
      employees,
      sites,
      modules: selectedModules,
      lines,
      total: lines.reduce((sum, line) => sum + line.amount, 0),
    };
  };

  const buildContactUrl = (quote) => {
    const params = new URLSearchParams({
      quote: quote.reference,
      employees: String(quote.employees),
      sites: String(quote.sites),
      modules: quote.modules.join(","),
      total: String(quote.total),
    });
    return `/book-demo/?${params.toString()}`;
  };

  const renderQuote = (root, quote, statusMessage = "") => {
    root.querySelector("[data-quote-empty]").hidden = true;
    root.querySelector("[data-quote-content]").hidden = false;
    root.querySelector("[data-quote-reference]").textContent = quote.reference;
    root.querySelector("[data-quote-total]").textContent = euro.format(quote.total);

    const breakdown = root.querySelector("[data-quote-breakdown]");
    breakdown.replaceChildren();
    quote.lines.forEach((line) => {
      const row = document.createElement("div");
      const label = document.createElement("span");
      const price = document.createElement("strong");
      label.textContent = line.minimumApplied ? `${line.name} · minimum applied` : line.name;
      price.textContent = euro.format(line.amount);
      row.append(label, price);
      breakdown.append(row);
    });

    root.querySelector("[data-quote-contact]").href = buildContactUrl(quote);
    root.querySelector("[data-quote-status]").textContent = statusMessage;
    root.dataset.currentQuote = JSON.stringify(quote);
  };

  const calculator = document.querySelector("[data-quote-calculator]");
  if (calculator) {
    const form = calculator.querySelector("[data-quote-form]");
    const employeesInput = calculator.querySelector("[data-quote-employees]");
    const sitesInput = calculator.querySelector("[data-quote-sites]");
    const moduleInputs = [...calculator.querySelectorAll("[data-quote-module]")];
    const error = calculator.querySelector("[data-quote-error]");

    const showError = (message) => {
      error.textContent = message;
      error.hidden = false;
    };

    const clearError = () => {
      error.textContent = "";
      error.hidden = true;
    };

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      clearError();

      const employees = Number(employeesInput.value);
      const sites = Number(sitesInput.value);
      const selected = moduleInputs.filter((input) => input.checked).map((input) => input.value);
      const selectedCore = selected.filter((key) => !modules[key]?.addOn);

      if (!Number.isInteger(employees) || employees < 1 || !Number.isInteger(sites) || sites < 1) {
        showError("Enter at least 1 employee and 1 site.");
        return;
      }
      if (!selected.length) {
        showError("Choose at least one module.");
        return;
      }
      if (selected.includes("elevate") && !selectedCore.length) {
        showError("Elevate is an add-on. Choose at least one core module as well.");
        return;
      }

      const quote = calculateQuote(employees, sites, selected);
      renderQuote(calculator, quote);
      calculator.querySelector("[data-quote-result]").scrollIntoView({ block: "nearest" });
    });

    calculator.querySelector("[data-quote-save]").addEventListener("click", () => {
      const raw = calculator.dataset.currentQuote;
      if (!raw) return;
      try {
        const quote = JSON.parse(raw);
        window.localStorage.setItem(STORAGE_KEY, raw);
        calculator.querySelector("[data-quote-status]").textContent = `Saved on this device as ${quote.reference}.`;
      } catch {
        calculator.querySelector("[data-quote-status]").textContent = "This browser could not save the quote locally.";
      }
    });

    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
      if (saved?.version === PRICING_VERSION && saved.reference) {
        employeesInput.value = saved.employees;
        sitesInput.value = saved.sites;
        moduleInputs.forEach((input) => { input.checked = saved.modules.includes(input.value); });
        renderQuote(calculator, saved, `Saved quote ${saved.reference} loaded from this device.`);
      }
    } catch {
      // Local storage is optional; calculator remains fully usable without it.
    }
  }

  const enquiryForm = document.querySelector("[data-quote-enquiry]");
  if (enquiryForm) {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("quote");
    if (!reference) return;

    const employees = Number(params.get("employees") || "");
    const sites = Number(params.get("sites") || "");
    const selected = (params.get("modules") || "").split(",").filter((key) => modules[key]);
    const suppliedTotal = Number.parseInt(params.get("total") || "", 10);

    let quote = null;
    if (Number.isInteger(employees) && employees > 0 && Number.isInteger(sites) && sites > 0 && selected.length) {
      quote = calculateQuote(employees, sites, selected, reference);
    }

    const details = quote
      ? `${quote.lines.map((line) => `${line.name}: ${euro.format(line.amount)}`).join("; ")}. Employees: ${quote.employees}. Sites: ${quote.sites}.`
      : "Pricing calculator enquiry.";
    const total = quote?.total || (Number.isInteger(suppliedTotal) ? suppliedTotal : 0);

    enquiryForm.querySelector("[data-enquiry-quote-reference]").value = reference;
    enquiryForm.querySelector("[data-enquiry-quote-details]").value = details;
    enquiryForm.querySelector("[data-enquiry-quote-total]").value = total ? euro.format(total) : "";

    const context = enquiryForm.querySelector("[data-quote-context]");
    context.hidden = false;
    context.querySelector("[data-quote-context-reference]").textContent = reference;
    context.querySelector("[data-quote-context-summary]").textContent = quote
      ? `${quote.modules.map((key) => modules[key].name).join(", ")} · ${euro.format(quote.total)} indicative annual total`
      : "We’ll include this quote reference with your enquiry.";

    if (quote) {
      const locationSelect = enquiryForm.querySelector('select[name="locations"]');
      const employeeSelect = enquiryForm.querySelector('select[name="employees"]');
      const prioritySelect = enquiryForm.querySelector('select[name="priority"]');

      const locationValue = quote.sites === 1 ? "1" : quote.sites <= 10 ? "2–10" : quote.sites <= 50 ? "11–50" : quote.sites <= 200 ? "51–200" : "200+";
      const employeeValue = quote.employees <= 50 ? "1–50" : quote.employees <= 250 ? "51–250" : quote.employees <= 1000 ? "251–1,000" : quote.employees <= 5000 ? "1,001–5,000" : "5,000+";
      if (locationSelect) locationSelect.value = locationValue;
      if (employeeSelect) employeeSelect.value = employeeValue;

      const firstCore = quote.modules.find((key) => !modules[key].addOn);
      if (prioritySelect && firstCore) {
        const matchingOption = [...prioritySelect.options].find((option) => option.textContent.trim().startsWith(`${modules[firstCore].name} —`));
        if (matchingOption) prioritySelect.value = matchingOption.value;
      }
    }
  }
})();
