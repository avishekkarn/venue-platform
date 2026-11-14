import type { JSX } from "react";
import { requireRole } from "@/lib/auth/require-role";
import { prisma } from "@/infrastructure/db/client";
import { createPrismaMenuRepository } from "@/infrastructure/db/repositories/menu.repo";
import { MenuItemState } from "@/domain/menu/menu.repository";

export default async function AdminDashboardPage(): Promise<JSX.Element> {
  const staff = await requireRole(["admin"]);

  const menuRepo = createPrismaMenuRepository(prisma);
  const itemsResult = await menuRepo.listItems(staff.venueId);
  const items = itemsResult.ok ? itemsResult.value : [];

  return (
    <section className="flex flex-col items-center justify-start">
      <div className="w-full max-w-2xl flex flex-col items-center text-center gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-[28px] leading-[36px] font-semibold text-staff-text-primary">
            Admin Dashboard
          </h1>
          <h2 className="text-[18px] leading-[24px] font-medium text-staff-text-primary">
            Welcome, {staff.name}
          </h2>
          <p className="text-[14px] leading-[20px] text-staff-text-muted">
            Roles: {staff.roles.join(", ")}
          </p>
        </header>

        <section aria-labelledby="menu-management-heading" className="w-full text-left bg-staff-surface-raised rounded-lg border border-staff-border-subtle p-5 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-staff-border-subtle">
            <div>
              <h3 id="menu-management-heading" className="text-lg font-medium text-staff-text-primary">
                Menu Item Availability
              </h3>
              <p className="text-xs text-staff-text-muted mt-0.5">
                Toggle availability status across guest devices in real-time.
              </p>
            </div>
            <span className="text-xs font-mono text-staff-text-muted">
              {items.length} items
            </span>
          </div>

          {items.length === 0 ? (
            <p className="py-6 text-sm text-center text-staff-text-muted">
              No menu items found for this venue.
            </p>
          ) : (
            <ul className="divide-y divide-staff-border-subtle">
              {items.map((item) => {
                const isAvailable = item.state === MenuItemState.AVAILABLE;
                const nextState = isAvailable
                  ? MenuItemState.UNAVAILABLE
                  : MenuItemState.AVAILABLE;
                const actionLabel = isAvailable
                  ? "Mark Unavailable"
                  : "Mark Available";

                return (
                  <li
                    key={item.id}
                    className="py-3.5 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-staff-text-primary truncate">
                        {item.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                            isAvailable
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900"
                              : item.state === MenuItemState.UNAVAILABLE
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-900"
                              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700"
                          }`}
                        >
                          {item.state}
                        </span>
                        <span className="text-xs font-mono text-staff-text-muted">
                          ${item.price}
                        </span>
                      </div>
                    </div>

                    <form
                      data-item-form
                      action={`/api/admin/menu/items/${item.id}/state`}
                      method="POST"
                    >
                      <input type="hidden" name="state" value={nextState} />
                      <button
                        type="submit"
                        className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-all select-none outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed ${
                          isAvailable
                            ? "border-amber-300 text-amber-800 bg-amber-50/50 hover:bg-amber-100/60 dark:border-amber-800 dark:text-amber-300 dark:bg-amber-950/30 dark:hover:bg-amber-950/60"
                            : "border-emerald-300 text-emerald-800 bg-emerald-50/50 hover:bg-emerald-100/60 dark:border-emerald-800 dark:text-emerald-300 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/60"
                        }`}
                      >
                        {actionLabel}
                      </button>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
(function() {
  function getCsrfToken() {
    // The CSRF cookie (D-20.1) is NOT HttpOnly, so the client can read it.
    // Server source of truth: src/infrastructure/csrf/cookies.ts
    // Cookie name is 'csrf_token'; header name is 'X-CSRF-Token'.
    var match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  var forms = document.querySelectorAll('form[data-item-form]');
  forms.forEach(function(form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var btn = form.querySelector('button');
      if (btn) btn.disabled = true;
      var url = form.getAttribute('action');
      var stateInput = form.querySelector('input[name="state"]');
      var stateVal = stateInput ? stateInput.value : '';
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken(),
        },
        body: JSON.stringify({ state: stateVal })
      })
      .then(function(res) {
        if (res.ok) {
          window.location.reload();
        } else {
          return res.json().then(function(data) {
            alert('Error updating item: ' + ((data && data.error && data.error.message) || 'Unknown error'));
            if (btn) btn.disabled = false;
          });
        }
      })
      .catch(function() {
        alert('Network error updating item');
        if (btn) btn.disabled = false;
      });
    });
  });
})();
`,
        }}
      />
    </section>
  );
}
