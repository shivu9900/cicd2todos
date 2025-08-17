import handler from "../../pages/api/todos";
import httpMocks from "node-mocks-http";

jest.mock("../../lib/db", () => ({
  query: jest.fn().mockResolvedValue([[{ id: 1, text: "Test todo", completed: false }]])
}));

describe("/api/todos API", () => {
  it("GET returns todos", async () => {
    const req = httpMocks.createRequest({ method: "GET" });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res._getStatusCode()).toBe(200);
    const data = res._getData();
    expect(JSON.parse(data)).toEqual([{ id: 1, text: "Test todo", completed: false }]);
  });

  it("POST creates a todo", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { text: "New todo" }
    });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res._getStatusCode()).toBe(201);
  });
});
