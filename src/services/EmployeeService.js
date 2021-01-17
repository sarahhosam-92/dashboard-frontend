import http from "../http-common";

class EmplyeeDataService {
  getAll() {
    return http.get("/employees");
  }


  create(data) {
    return http.post("/employees", data);
  }

  update(id, data) {
    return http.put(`/employees/${id}`, data);
  }

  delete(id) {
    return http.delete(`/employees/${id}`);
  }
}

export default new EmplyeeDataService();