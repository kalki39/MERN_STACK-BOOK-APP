let skip = 0; //for pagination it use in query

document.addEventListener("click", function (event) {
  if (event.target.classList.contains("add_item")) {
    event.preventDefault();
    console.log("add item");
    const tittle = document.getElementById("tittle").value;
    const author = document.getElementById("author").value;
    const price = document.getElementById("price").value;
    const category = document.getElementById("category").value;
    console.log(price);

    if (price === "") {
      alert("Please enter todo text");
      return;
    }

    axios
      .post("/create-item", { tittle, author, price, category })
      .then((res) => {
        console.log(res);
        if (res.data.status !== 201) {
          alert(res.data.message);
        }

        tittle.value = "";
        return;
        // document.getElementById("item_list").innerHTML = "";
        // generateTodos();
      })
      .catch((err) => {
        console.log(err);
        alert(err);
      });
  }

  if (event.target.classList.contains("edit-me")) {
    const id = event.target.getAttribute("data-id");
    const newData = prompt("Enter your new todo text");

    console.log(id, newData);
    axios
      .post("/edit-item", { id, newData })
      .then((res) => {
        if (res.data.status !== 200) {
          alert(res.data.message);
          return;
        }

        event.target.parentElement.parentElement.querySelector(
          ".item-text"
        ).innerHTML = newData;
      })
      .catch((err) => {
        console.log(err);
        alert(err);
      });
  }
  if (event.target.classList.contains("delete-me")) {
    const id = event.target.getAttribute("data-id");

    axios
      .post("/delete-item", { id })
      .then((res) => {
        if (res.data.status !== 200) {
          alert(res.data.message);
          return;
        }

        event.target.parentElement.parentElement.remove();
        return;
      })
      .catch((err) => {
        console.log(err);
        alert(err);
      });
  }

  if (event.target.classList.contains("show_more")) {
    //for pagination
    generateTodos();
  }
});

// window.onload = function () {
//   generateTodos();
// };

function generateTodos() {
  //read the todos
  axios
    .get(`/pagination_dashboard?skip=${skip}`)
    .then((res) => {
      if (res.data.status !== 200) {
        alert(res.data.message);
        return;
      }
      const todos = res.data.data;
      console.log(todos);
      document.getElementById("item_list").insertAdjacentHTML(
        "beforeend",
        todos
          .map((item) => {
            return `<div class="card" style="width: 18rem;">
  <div class="card-body">
    <h3 class="card-title">${item.tittle}</h3>
    <h6 class="card-subtitle mb-2 text-muted">By ${item.author}</h6>
    <h6 class="card-subtitle mb-2 text-muted">${item.prize}</h6>
    <h6 class="card-subtitle mb-2 text-muted">${item.category}</h6>
    <button data-id="${item._id}" class="edit-me btn btn-secondary btn-sm mr-1">Update</button>
    <button data-id="${item._id}" class="delete-me btn btn-danger btn-sm">Delete</button>
  </div>
</div>
      `;
          })
          .join("")
      );

      //increment skip by todos length
      skip += todos.length;
    })
    .catch((err) => {
      console.log(err);
    });
}

// document.getElementById("item_list").insertAdjacentHTML(
//   "beforeend",
//   todos
//     .map((item) => {
//       return `<li class="list-group-item list-group-item-action d-flex align-items-center justify-content-between">
//       <span class="item-text"> ${item.todo}</span>
//       <div>
//       <button data-id="${item._id}" class="edit-me btn btn-secondary btn-sm mr-1">Edit</button>
//       <button data-id="${item._id}" class="delete-me btn btn-danger btn-sm">Delete</button>
//   </div>
//   </li>`;
//     })
//     .join("")
// );
