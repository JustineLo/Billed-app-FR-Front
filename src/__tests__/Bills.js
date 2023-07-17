/**
 * @jest-environment jsdom
 */


import userEvent from "@testing-library/user-event";
import BillsUI from "../views/BillsUI.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import Bills from "../containers/Bills.js";

import { screen, waitFor } from "@testing-library/dom";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router";
import { bills } from "../fixtures/bills.js";


jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon.classList.contains('active-icon')).toBeTruthy()

    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })


    test("Then I should be redirected to NewBill Page when I click on the 'Nouvelle note de frais' button", () => {

      const html = BillsUI({ data: bills })
      document.body.innerHTML = html

      const onNavigate = jest.fn((pathname) => {
        document.body.innerHTML = ROUTES({pathname})
      })

      const newBills = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage
      })

      const handleClickNewBill = jest.fn(newBills.handleClickNewBill)

      const newBillButton = screen.getByTestId("btn-new-bill")
      newBillButton.addEventListener("click", handleClickNewBill)
      userEvent.click(newBillButton)
      expect(handleClickNewBill).toHaveBeenCalled()

      expect(screen.getByTestId('form-new-bill')).toBeTruthy()
    })
  })

  // GET Bills test d'intégration
    describe("When I navigate to the Bills page", () => {
      test("Then it fetches bills from mock API GET", async () => {
        localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "employee@test.tld" }));
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.append(root)
        router()
        window.onNavigate(ROUTES_PATH.Bills)
        await waitFor(() => screen.getByText("Mes notes de frais"))
        const contentPending  = await screen.getByText("En attente")
        expect(contentPending).toBeTruthy()
        const contentRefused  = await screen.getAllByText("Refused")[0]
        expect(contentRefused).toBeTruthy()
        expect(screen.getAllByTestId("icon-eye")[0]).toBeTruthy()
      })
    
      describe("When an error occurs on API", () => {
        beforeEach(() => {
          jest.spyOn(mockStore, "bills")
          Object.defineProperty(
              window,
              'localStorage',
              { value: localStorageMock }
          )
          window.localStorage.setItem('user', JSON.stringify({
            type: 'Employee',
            email: "e@e"
          }))
          const root = document.createElement("div")
          root.setAttribute("id", "root")
          document.body.appendChild(root)
          router()
        })
        test("Then it fetches bills from an API and fails with 404 message error", async () => {
    
          mockStore.bills.mockImplementationOnce(() => {
            return {
              list : () =>  {
                return Promise.reject(new Error("Erreur 404"))
              }
            }})
          window.onNavigate(ROUTES_PATH.Bills)
          await new Promise(process.nextTick);
          const message = await screen.getByText(/Erreur 404/)
          expect(message).toBeTruthy()
        })
    
        test("Then it fetches messages from an API and fails with 500 message error", async () => {
    
          mockStore.bills.mockImplementationOnce(() => {
            return {
              list : () =>  {
                return Promise.reject(new Error("Erreur 500"))
              }
            }})
    
          window.onNavigate(ROUTES_PATH.Bills)
          await new Promise(process.nextTick);
          const message = await screen.getByText(/Erreur 500/)
          expect(message).toBeTruthy()
        })
      })
  })
})