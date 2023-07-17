/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import mockStore from "../__mocks__/store";

jest.mock("../app/store", () => mockStore)


describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    beforeEach(() => {
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn().mockImplementation((key) => {
            if (key === 'user') {
              return JSON.stringify({ email: 'employee@test.tld' });
            }
          }),
        },
        writable: true
      });
    });

    // TEST D'INTEGRATION POST 
    describe("When I submit the new bill form with valid information", () => {
      test("Then it posts a new bill on mock API POST", async () => {
        const newBill = {
          "id": "qcCK3SzECmaZAGRrHjaC",
          "status": "refused",
          "pct": 20,
          "amount": 200,
          "email": "sdfsd@dsfsdfe"
        }
        
        jest.spyOn(mockStore.bills(), 'create')
        const bill = await mockStore.bills().create(newBill)
  
        expect(bill).toEqual({
          fileUrl: 'https://localhost:3456/images/test.jpg', 
          key: '1234'
        }) 
      })
    
      test("it posts new bill to an API and fails with 404 message error", async () => {
        const errorMessage = 'Erreur 404';
        jest.spyOn(mockStore.bills(), 'update').mockRejectedValue(new Error(errorMessage));
      
        const mockFormData = {
          'expense-type': 'Restaurants et bars',
          'expense-name': 'Lunch Meeting',
          'datepicker': '',
          'amount': '200',
          'vat': '40',
          'pct': '20',
          'commentary': 'Business discussion',
          'file': new File(['file-content'], 'file.jpg', { type: 'image/jpeg' })
        };
      
        const querySelectorMock = selector => {
          const key = selector.match(/\[data-testid="([^"]+)"\]/)[1];
          return { value: mockFormData[key] };
        };
      
        const html = NewBillUI();
        document.body.innerHTML = html;
      
        const onNavigate = jest.fn();
        const localStorage = window.localStorage;
        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage
        });
      
        const form = screen.getByTestId("form-new-bill");
      
        const consoleErrorSpy = jest.spyOn(console, 'error');
      
        newBill.handleSubmit({
          preventDefault: () => {},
          target: {
            elements: mockFormData,
            querySelector: querySelectorMock
          }
        });
      
        await waitFor(() => {
          expect(consoleErrorSpy).toHaveBeenCalledWith(new Error(errorMessage));
        });
      });
    })
    

    test("Then an error message should be displayed when I submit the form with invalid information", () => {

      const mockFormData = {
        'expense-type': 'Restaurants et bars',
        'expense-name': 'Lunch Meeting',
        'datepicker': '',
        'amount': '200',
        'vat': '40',
        'pct': '20',
        'commentary': 'Business discussion',
        'file': new File(['file-content'], 'file.jpg', { type: 'image/jpeg' })
      }
      
      const querySelectorMock = selector => {
        const key = selector.match(/\[data-testid="([^"]+)"\]/)[1];
        return { value: mockFormData[key] };
      }

      const html = NewBillUI()
      document.body.innerHTML = html

      const onNavigate = jest.fn()
      const localStorage = window.localStorage
      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage
      })

      const form = screen.getByTestId("form-new-bill")

      newBill.handleSubmit = jest.fn(newBill.handleSubmit.bind(newBill))

      newBill.handleSubmit({
        preventDefault: () => {},
        target: {
            elements: mockFormData,
            querySelector: querySelectorMock
        }
      })

      expect(newBill.handleSubmit).toHaveBeenCalled()
      expect(form.checkValidity()).toBe(false)
    })

    test("Then a file should be uploaded when I change the file input", async () => {
      global.FileReader = class {
        readAsDataURL = () => {
          this.onload({
            target: {
              result: 'test-data-url'
            }
          })
        }
        addEventListener = jest.fn((event, callback) => callback())
      }
  
      const mockCreate = jest.fn().mockResolvedValue({ 
        fileUrl: 'test-file-url', 
        key: 'test-key' 
      })
    
      const mockStore = {
        bills: jest.fn().mockReturnValue({
          create: mockCreate
        })
      }
    
      const mockFileChangeEvent = {
        preventDefault: jest.fn(),
        target: {
          value: 'C:\\fakepath\\image.jpg'
        }
      }
    
      const html = NewBillUI()
      document.body.innerHTML = html
    
      const onNavigate = jest.fn()
      const localStorage = window.localStorage
    
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage
      })
    
      newBill.document.querySelector = jest.fn().mockReturnValue({
        files: [new File(['file-content'], 'file.jpg', { type: 'image/jpeg' })]
      });
    
      newBill.handleChangeFile(mockFileChangeEvent)
    
      await waitFor(() => expect(mockCreate).toHaveBeenCalled())
    
      expect(newBill.fileUrl).toBe('test-file-url')
      expect(newBill.fileName).toBe('image.jpg')
      expect(newBill.billId).toBe('test-key')
    })
     
   })

   
})
